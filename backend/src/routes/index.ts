import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { PostController } from '../controllers/post.controller';
import { authenticateToken } from '../middlewares/auth';
import adminRoutes from './admin';
import empresasRoutes from './empresas';
import squadsRoutes from './squads';
import usersRoutes from './users';

const routes = Router();
const authController = new AuthController();
const postController = new PostController();

// Health check
routes.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

// Authentication routes
routes.post('/auth/register', authController.register.bind(authController));
routes.post('/auth/login', authController.login.bind(authController));

// Profile routes (protected)
routes.put('/auth/profile', authenticateToken, authController.updateProfile.bind(authController));
routes.put('/auth/password', authenticateToken, authController.changePassword.bind(authController));

// Admin routes (super-user only)
routes.use('/admin', adminRoutes);

// New hierarchical structure routes
routes.use('/empresas', empresasRoutes);
routes.use('/squads', squadsRoutes);
routes.use('/users', usersRoutes);

// Post routes (protected - with hierarchical permissions)
routes.get('/posts', authenticateToken, postController.listPosts.bind(postController));
routes.get('/posts/calendar/:year/:month', authenticateToken, postController.getCalendarPosts.bind(postController));
routes.post('/posts', authenticateToken, postController.createPost.bind(postController));
routes.get('/posts/:id', authenticateToken, postController.getPost.bind(postController));
routes.patch('/posts/:id/status', authenticateToken, postController.updatePostStatus.bind(postController));

export default routes;
