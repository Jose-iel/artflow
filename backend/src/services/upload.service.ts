import { Formidable } from 'formidable'
import path from 'path'
import fs from 'fs/promises'
import { mkdirSync } from 'fs'
import { Request } from 'express'
import { Fields, Files, File, Part } from 'formidable'
import { FileValidatorService } from './file-validator.service'
import AppError from '../utils/AppError'

interface UploadRequestUser {
  id?: string
  empresaId?: string
  squad?: { empresaId?: string }
}

export interface UploadResult {
  filePath: string
  fileName: string
  mimeType: string
}

export class UploadService {
  private uploadDir: string
  private maxFileSize: number
  private validator: FileValidatorService

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads'
    this.maxFileSize = (parseInt(process.env.MAX_FILE_SIZE || '500')) * 1024 * 1024 // 500MB
    this.validator = new FileValidatorService()
  }

  /**
   * Cria uma instância configurada do Formidable, compartilhada entre
   * upload simples e múltiplo. O callback `filename` resolve empresa/cliente/post
   * a partir do request, sanitiza os componentes e cria o diretório de destino.
   * @param maxFiles - Limite opcional de arquivos (usado no upload de carrossel)
   */
  private createForm(maxFiles?: number): InstanceType<typeof Formidable> {
    return new Formidable({
      uploadDir: this.uploadDir,
      keepExtensions: true,
      maxFileSize: this.maxFileSize,
      ...(maxFiles ? { maxFiles } : {}),
      filter: (part: Part): boolean => {
        return !!(part.mimetype?.startsWith('image/') || part.mimetype?.startsWith('video/'))
      },
      filename: (_name: string, ext: string, part: Part, form: InstanceType<typeof Formidable>): string => {
        // O request só fica disponível no Formidable durante o parse
        const request = (form as unknown as { req: Request & { user?: UploadRequestUser } }).req

        const rawEmpresaId = request.user?.empresaId || request.user?.squad?.empresaId

        // Pegar clienteId de query params ou headers (body não está disponível aqui)
        const rawClienteId =
          (request.query.clienteId as string) ||
          (request.headers['x-cliente-id'] as string) ||
          request.user?.id

        const rawPostId =
          (request.query.postId as string) ||
          (request.headers['x-post-id'] as string)

        // Sanitizar paths para prevenir path traversal
        const empresaId = this.validator.sanitizePathComponent(rawEmpresaId as string, 'default')
        const clienteId = this.validator.sanitizePathComponent(rawClienteId as string, 'anonymous')
        const postId = this.validator.sanitizePathComponent(rawPostId as string, 'temp')

        const fileType = part.mimetype?.startsWith('image/') ? 'images' : 'videos'

        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        // Remover TODOS os caracteres especiais, incluindo pontos
        const sanitizedName = part.originalFilename?.replace(/[^a-zA-Z0-9]/g, '_') || 'file'
        const uniqueName = `${postId}_${timestamp}_${randomSuffix}_${sanitizedName}${ext}`

        // Criar diretório apenas quando necessário
        const dirPath = path.join(this.uploadDir, empresaId, clienteId, fileType)
        mkdirSync(dirPath, { recursive: true })

        return `${empresaId}/${clienteId}/${fileType}/${uniqueName}`
      }
    })
  }

  /**
   * Valida um arquivo já recebido (path traversal, tamanho e magic bytes)
   * e retorna seus metadados relativos. Lança AppError em caso de falha;
   * o arquivo inválido já é removido pelo validator.
   */
  private async validateUploadedFile(file: File): Promise<UploadResult> {
    // SEGURANÇA: Validar path para prevenir path traversal
    const absoluteUploadDir = path.resolve(this.uploadDir)
    const absoluteFilePath = path.resolve(file.filepath)
    this.validator.validatePath(absoluteFilePath, absoluteUploadDir)

    // SEGURANÇA: Validar tamanho real do arquivo
    await this.validator.validateFileSize(file.filepath)

    // SEGURANÇA: Validar tipo de arquivo através de magic bytes
    await this.validator.validateFileType(file.filepath, file.mimetype || '')

    // Remove o caminho absoluto do uploadDir para retornar apenas o caminho relativo
    const relativePath = file.filepath.replace(absoluteUploadDir + '/', '')

    return {
      filePath: relativePath,
      fileName: file.originalFilename || 'unknown',
      mimeType: file.mimetype || 'application/octet-stream'
    }
  }

  async handleUpload(req: Request): Promise<UploadResult> {
    const form = this.createForm()

    return new Promise((resolve, reject) => {
      form.parse(req, async (err: Error | null, _fields: Fields<string>, files: Files<string>) => {
        if (err) {
          reject(err)
          return
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file
        if (!file) {
          reject(new AppError('Nenhum arquivo foi enviado', 400))
          return
        }

        try {
          resolve(await this.validateUploadedFile(file))
        } catch (error) {
          // Se houver erro na validação, o arquivo já foi deletado pelo validator
          reject(error)
        }
      })
    })
  }

  /**
   * Handle multiple file uploads for carousel support
   * @param req - Express request object
   * @returns Promise<UploadResult[]>
   */
  async handleMultipleUploads(req: Request): Promise<UploadResult[]> {
    const maxFiles = 10 // Maximum files per carousel (Instagram limit)
    const form = this.createForm(maxFiles)

    return new Promise((resolve, reject) => {
      form.parse(req, async (err: Error | null, _fields: Fields<string>, files: Files<string>) => {
        if (err) {
          reject(err)
          return
        }

        // Get all files from the request
        let uploadedFiles: File[] = []
        if (files.file) {
          uploadedFiles = Array.isArray(files.file) ? files.file : [files.file]
        }

        if (uploadedFiles.length === 0) {
          reject(new AppError('Nenhum arquivo foi enviado', 400))
          return
        }

        if (uploadedFiles.length > maxFiles) {
          reject(new AppError(`Máximo de ${maxFiles} arquivos permitidos`, 400))
          return
        }

        const results: UploadResult[] = []
        const errors: string[] = []

        // Process each file
        for (let i = 0; i < uploadedFiles.length; i++) {
          try {
            results.push(await this.validateUploadedFile(uploadedFiles[i]))
          } catch (error) {
            // Collect errors but continue processing other files
            errors.push(`Arquivo ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
          }
        }

        // If any validation failed, cleanup uploaded files and reject
        if (errors.length > 0) {
          // Cleanup successfully uploaded files
          for (const result of results) {
            try {
              await this.deleteFile(result.filePath)
            } catch {
              // Ignore cleanup errors
            }
          }
          reject(new AppError(`Erros no upload:\n${errors.join('\n')}`, 400))
          return
        }

        resolve(results)
      })
    })
  }

  /**
   * Delete multiple files from filesystem
   * @param filePaths - Array of relative file paths
   * @returns Promise<void>
   */
  async deleteMultipleFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      await this.deleteFile(filePath)
    }
  }

  /**
   * Deleta um arquivo do filesystem
   * @param filePath - Caminho relativo do arquivo (ex: empresa-1/client-1/images/file.jpg)
   * @returns Promise<void>
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (!filePath) {
        console.warn('deleteFile: filePath vazio, nada a deletar')
        return
      }

      const absoluteUploadDir = path.resolve(this.uploadDir)
      const absoluteFilePath = path.resolve(this.uploadDir, filePath)

      // SEGURANÇA: Validar que o arquivo está dentro do diretório de uploads
      this.validator.validatePath(absoluteFilePath, absoluteUploadDir)

      // Verificar se o arquivo existe antes de tentar deletar
      try {
        await fs.access(absoluteFilePath)
      } catch {
        console.warn(`deleteFile: Arquivo não encontrado: ${filePath}`)
        return // Arquivo não existe, não precisa deletar
      }

      // Deletar o arquivo
      await fs.unlink(absoluteFilePath)
      console.log(`Arquivo deletado com sucesso: ${filePath}`)
    } catch (error) {
      console.error(`Erro ao deletar arquivo ${filePath}:`, error)
      // Não lançar erro para não bloquear a deleção do post
      // O arquivo pode já ter sido deletado ou não existir mais
    }
  }
}
