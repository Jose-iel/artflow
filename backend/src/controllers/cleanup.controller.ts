import { Request, Response } from 'express'
import { cleanupService } from '../services/cleanup.service'
import AppError from '../utils/AppError'
import { AuthenticatedRequest } from '../middlewares/auth'

export class CleanupController {
  async runCleanup(req: AuthenticatedRequest, res: Response) {
    try {
      // Verifica se usuário é admin
      if (!req.user || req.user.role !== 'ADMIN_MASTER') {
        throw new AppError('Acesso negado', 403)
      }

      await cleanupService.runCleanupManually()

      res.json({
        message: 'Limpeza executada com sucesso',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        })
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro ao executar limpeza'
        })
      }
    }
  }

  async checkOrphanedFiles(req: AuthenticatedRequest, res: Response) {
    try {
      // Verifica se usuário é admin
      if (!req.user || req.user.role !== 'ADMIN_MASTER') {
        throw new AppError('Acesso negado', 403)
      }

      const orphanedFiles = await cleanupService.checkOrphanedFiles()

      res.json({
        message: 'Verificação concluída',
        orphanedFiles,
        count: orphanedFiles.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        })
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro ao verificar arquivos órfãos'
        })
      }
    }
  }

  async cleanupOrphanedFiles(req: AuthenticatedRequest, res: Response) {
    try {
      // Verifica se usuário é admin
      if (!req.user || req.user.role !== 'ADMIN_MASTER') {
        throw new AppError('Acesso negado', 403)
      }

      await cleanupService.cleanupOrphanedFiles()

      res.json({
        message: 'Arquivos órfãos removidos com sucesso',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        })
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Erro ao remover arquivos órfãos'
        })
      }
    }
  }
}
