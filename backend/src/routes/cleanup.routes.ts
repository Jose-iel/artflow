import { Router } from 'express'
import { CleanupController } from '../controllers/cleanup.controller'
import { authenticateToken } from '../middlewares/auth'

const router = Router()
const cleanupController = new CleanupController()

// Todas as rotas exigem autenticação e nível de admin
router.post('/run', authenticateToken, cleanupController.runCleanup)
router.get('/orphaned', authenticateToken, cleanupController.checkOrphanedFiles)
router.delete('/orphaned', authenticateToken, cleanupController.cleanupOrphanedFiles)

export default router
