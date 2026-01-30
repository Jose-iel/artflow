import { Router } from 'express'
import { UploadController } from '../controllers/upload.controller'
import { authenticateToken } from '../middlewares/auth'

const router = Router()
const uploadController = new UploadController()

router.post('/upload', authenticateToken, uploadController.uploadFile)

export { router as uploadRoutes }
