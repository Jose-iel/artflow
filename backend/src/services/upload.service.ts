import { Formidable } from 'formidable'
import path from 'path'
import fs from 'fs/promises'
import { Request } from 'express'
import { Fields, Files, File, Part } from 'formidable'
import { FileValidatorService } from './file-validator.service'
import AppError from '../utils/AppError'

export class UploadService {
  private uploadDir: string
  private maxFileSize: number
  private validator: FileValidatorService

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads'
    this.maxFileSize = (parseInt(process.env.MAX_FILE_SIZE || '500')) * 1024 * 1024 // 500MB
    this.validator = new FileValidatorService()
  }

  async handleUpload(req: Request): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const form = new Formidable({
      uploadDir: this.uploadDir,
      keepExtensions: true,
      maxFileSize: this.maxFileSize,
      filter: function (part: Part): boolean {
        return !!(part.mimetype?.startsWith('image/') || part.mimetype?.startsWith('video/'))
      },
      filename: (name: string, ext: string, part: Part, form: any) => {
        const request = form.req as Request
        const rawEmpresaId = (request as any).user?.empresaId || (request as any).user?.squad?.empresaId
        
        // Pegar clienteId de query params ou headers (body não está disponível aqui)
        const rawClienteId = (request as any).query?.clienteId || 
                             (request as any).headers['x-cliente-id'] || 
                             (request as any).user?.id
        
        const rawPostId = (request as any).query?.postId || 
                          (request as any).headers['x-post-id']
        
        // Sanitizar paths para prevenir path traversal
        const empresaId = this.validator.sanitizePathComponent(rawEmpresaId, 'default')
        const clienteId = this.validator.sanitizePathComponent(rawClienteId, 'anonymous')
        const postId = this.validator.sanitizePathComponent(rawPostId, 'temp')
        
        const fileType = part.mimetype?.startsWith('image/') ? 'images' : 'videos'
        
        const timestamp = Date.now()
        // Remover TODOS os caracteres especiais, incluindo pontos
        const sanitizedName = part.originalFilename?.replace(/[^a-zA-Z0-9]/g, '_') || 'file'
        const uniqueName = `${postId}_${timestamp}_${sanitizedName}${ext}`
        
        // Criar diretório apenas quando necessário
        const dirPath = path.join(this.uploadDir, empresaId, clienteId, fileType)
        try {
          require('fs').mkdirSync(dirPath, { recursive: true })
        } catch (error) {
          // Directory already exists
        }
        
        return `${empresaId}/${clienteId}/${fileType}/${uniqueName}`
      }
    })

    return new Promise((resolve, reject) => {
      form.parse(req, async (err: any, fields: Fields<string>, files: Files<string>) => {
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
          
          resolve({
            filePath: relativePath,
            fileName: file.originalFilename || 'unknown',
            mimeType: file.mimetype || 'application/octet-stream'
          })
        } catch (error) {
          // Se houver erro na validação, o arquivo já foi deletado pelo validator
          reject(error)
        }
      })
    })
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
