import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireRole } from '../middlewares/permissions';
import { UserRole } from '../entities/User';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication
router.use(authenticateToken);

// All admin routes require admin privileges (ADMIN_MASTER or FUNCIONARIO)
router.use(requireRole([UserRole.ADMIN_MASTER, UserRole.FUNCIONARIO]));

// USER MANAGEMENT ENDPOINTS
router.post('/users/create', adminController.createClient.bind(adminController));
router.get('/users', adminController.listUsers.bind(adminController));
router.patch('/users/:id', adminController.updateUser.bind(adminController));
router.patch('/users/:id/deactivate', adminController.deactivateUser.bind(adminController));
router.get('/clientes', adminController.getClients.bind(adminController));

// POST MANAGEMENT ENDPOINTS
router.get('/posts/stats', adminController.getPostStats.bind(adminController));
router.post('/posts', adminController.createPostForClient.bind(adminController));
router.get('/posts', adminController.getDashboardPosts.bind(adminController));
router.put('/posts/:id', adminController.updatePost.bind(adminController));
router.delete('/posts/:id', adminController.deletePost.bind(adminController));

export default router;
