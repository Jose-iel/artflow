import { Request, Response } from 'express'
import { UploadService } from '../services/upload.service'
import AppError from '../utils/AppError'

export class UploadController {
  private uploadService: UploadService

  constructor() {
    this.uploadService = new UploadService()
    this.uploadFile = this.uploadFile.bind(this)
  }

  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.uploadService.handleUpload(req)
      
      res.status(201).json({
        message: 'Arquivo enviado com sucesso',
        data: {
          filePath: result.filePath,
          fileName: result.fileName,
          mimeType: result.mimeType,
          url: `/uploads/${result.filePath}`
        }
      })
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        })
        return
      }

      console.error('Upload error:', error)
      res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      })
    }
  }
}
