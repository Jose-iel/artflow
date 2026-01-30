import { Formidable } from 'formidable'
import path from 'path'
import fs from 'fs/promises'
import { Request } from 'express'
import { Fields, Files, File, Part } from 'formidable'

export class UploadService {
  private uploadDir: string
  private maxFileSize: number

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads'
    this.maxFileSize = (parseInt(process.env.MAX_FILE_SIZE || '500')) * 1024 * 1024 // 500MB
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
        const empresaId = (request as any).user?.empresaId || (request as any).user?.squad?.empresaId || 'default'
        
        // Pegar clienteId de query params ou headers (body não está disponível aqui)
        const clienteId = (request as any).query?.clienteId || 
                          (request as any).headers['x-cliente-id'] || 
                          (request as any).user?.id || 
                          'anonymous'
        
        const postId = (request as any).query?.postId || 
                       (request as any).headers['x-post-id'] || 
                       'temp'
        
        const fileType = part.mimetype?.startsWith('image/') ? 'images' : 'videos'
        
        const timestamp = Date.now()
        const sanitizedName = part.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'file'
        const uniqueName = `${postId}-${timestamp}-${sanitizedName}`
        
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
      form.parse(req, (err: any, fields: Fields<string>, files: Files<string>) => {
        if (err) reject(err)
        
        const file = Array.isArray(files.file) ? files.file[0] : files.file
        if (!file) reject(new Error('No file uploaded'))
        
        // Remove o caminho absoluto do uploadDir para retornar apenas o caminho relativo
        const absoluteUploadDir = path.resolve(this.uploadDir)
        const relativePath = file!.filepath.replace(absoluteUploadDir + '/', '')
        
        resolve({
          filePath: relativePath,
          fileName: file!.originalFilename || 'unknown',
          mimeType: file!.mimetype || 'application/octet-stream'
        })
      })
    })
  }
}
