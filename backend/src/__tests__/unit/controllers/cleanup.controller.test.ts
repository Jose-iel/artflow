import { CleanupController } from '../../../controllers/cleanup.controller'
import { Response } from 'express'
import { AuthenticatedRequest } from '../../../middlewares/auth'

// Mock the cleanup service
jest.mock('../../../services/cleanup.service', () => ({
  cleanupService: {
    runCleanupManually: jest.fn(),
    checkOrphanedFiles: jest.fn(),
    cleanupOrphanedFiles: jest.fn()
  }
}))

import { cleanupService } from '../../../services/cleanup.service'

describe('CleanupController', () => {
  let controller: CleanupController
  let mockRequest: Partial<AuthenticatedRequest>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    controller = new CleanupController()
    
    mockRequest = {
      user: {
        id: 'admin-123',
        role: 'ADMIN_MASTER'
      }
    } as any

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    jest.clearAllMocks()
  })

  describe('runCleanup', () => {
    it('should return 200 on successful cleanup', async () => {
      (cleanupService.runCleanupManually as jest.Mock).mockResolvedValue(undefined)

      await controller.runCleanup(mockRequest as AuthenticatedRequest, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Limpeza executada com sucesso',
        timestamp: expect.any(String)
      })
    })

    it('should return 403 if user is not admin', async () => {
      mockRequest.user = { id: 'user-123', role: 'CLIENTE' } as any

      await controller.runCleanup(mockRequest as AuthenticatedRequest, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado'
      })
    })

    it('should return 403 if user is missing', async () => {
      mockRequest.user = undefined

      await controller.runCleanup(mockRequest as AuthenticatedRequest, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado'
      })
    })
  })

  describe('checkOrphanedFiles', () => {
    it('should return orphaned files list', async () => {
      const files = ['file1.jpg', 'file2.mp4'];
      (cleanupService.checkOrphanedFiles as jest.Mock).mockResolvedValue(files)

      await controller.checkOrphanedFiles(mockRequest as AuthenticatedRequest, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Verificação concluída',
        orphanedFiles: files,
        count: 2,
        timestamp: expect.any(String)
      })
    })

    it('should return 403 if user is not admin', async () => {
      mockRequest.user = { id: 'user-123', role: 'FUNCIONARIO' } as any

      await controller.checkOrphanedFiles(mockRequest as AuthenticatedRequest, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado'
      })
    })
  })

  describe('cleanupOrphanedFiles', () => {
    it('should return success message', async () => {
      (cleanupService.cleanupOrphanedFiles as jest.Mock).mockResolvedValue(undefined)

      await controller.cleanupOrphanedFiles(mockRequest as AuthenticatedRequest, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Arquivos órfãos removidos com sucesso',
        timestamp: expect.any(String)
      })
    })

    it('should return 403 if user is not admin', async () => {
      mockRequest.user = { id: 'user-123', role: 'CLIENTE' } as any

      await controller.cleanupOrphanedFiles(mockRequest as AuthenticatedRequest, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Acesso negado'
      })
    })

    it('should handle service errors', async () => {
      const err = new Error('Cleanup failed');
      (cleanupService.cleanupOrphanedFiles as jest.Mock).mockRejectedValue(err)

      await controller.cleanupOrphanedFiles(mockRequest as AuthenticatedRequest, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erro ao remover arquivos órfãos'
      })
    })
  })
})
