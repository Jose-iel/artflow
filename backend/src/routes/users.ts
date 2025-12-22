import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdminMaster, canAccessUser } from '../middlewares/permissions';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/login', userController.login.bind(userController));

// Apply authentication to all other routes
router.use(authenticateToken);

// GET /api/users - List users (filtered by role)
router.get('/', userController.getAll.bind(userController));

// GET /api/users/:id - Get user by ID
router.get('/:id', canAccessUser, userController.getById.bind(userController));

// Admin Master only routes
router.post('/', requireAdminMaster, userController.create.bind(userController));
router.delete('/:id', requireAdminMaster, userController.delete.bind(userController));

// PUT /api/users/:id - Update user (Admin Master or own user)
router.put('/:id', canAccessUser, userController.update.bind(userController));

// PUT /api/users/:id/password - Update password (own user or Admin Master)
router.put('/:id/password', canAccessUser, userController.updatePassword.bind(userController));

export default router;
