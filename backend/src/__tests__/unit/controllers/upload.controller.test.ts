import { UploadController } from '../../../controllers/upload.controller'
import { Request, Response } from 'express'

describe('UploadController', () => {
  let controller: UploadController
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    controller = new UploadController()
    
    mockRequest = {
      user: {
        id: 'user-123',
        empresaId: 'empresa-456'
      },
      query: {},
      headers: {}
    } as any

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
  })

  describe('uploadFile', () => {
    it('should return 201 on successful upload', async () => {
      const mockFileData = {
        filePath: 'empresa/cliente/images/file.jpg',
        fileName: 'file.jpg',
        mimeType: 'image/jpeg'
      }

      // Mock the upload service
      jest.spyOn(controller['uploadService'], 'handleUpload').mockResolvedValue(mockFileData)

      await controller.uploadFile(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Arquivo enviado com sucesso',
        data: {
          filePath: mockFileData.filePath,
          fileName: mockFileData.fileName,
          mimeType: mockFileData.mimeType,
          url: `/uploads/${mockFileData.filePath}`
        }
      })
    })

    it('should handle errors from upload service', async () => {
      const error = new Error('Upload failed')
      
      jest.spyOn(controller['uploadService'], 'handleUpload').mockRejectedValue(error)

      await controller.uploadFile(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erro interno do servidor'
      })
    })

    it('should handle AppError correctly', async () => {
      const AppError = (await import('../../../utils/AppError')).default
      const error = new AppError('Arquivo muito grande', 400)
      
      jest.spyOn(controller['uploadService'], 'handleUpload').mockRejectedValue(error)

      await controller.uploadFile(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Arquivo muito grande'
      })
    })
  })
})
