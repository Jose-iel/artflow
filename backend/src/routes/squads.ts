import { Router } from 'express';
import { SquadController } from '../controllers/squad.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdminMaster } from '../middlewares/permissions';

const router = Router();
const squadController = new SquadController();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/squads - List squads (filtered by role)
router.get('/', squadController.getAll.bind(squadController));

// GET /api/squads/:id - Get squad by ID
router.get('/:id', squadController.getById.bind(squadController));

// Admin Master only routes
router.post('/', requireAdminMaster, squadController.create.bind(squadController));
router.put('/:id', requireAdminMaster, squadController.update.bind(squadController));
router.delete('/:id', requireAdminMaster, squadController.delete.bind(squadController));

// Squad management routes (Admin Master only)
router.post('/:id/funcionarios', requireAdminMaster, squadController.addFuncionario.bind(squadController));
router.delete('/:id/funcionarios/:usuarioId', requireAdminMaster, squadController.removeFuncionario.bind(squadController));

// GET /api/squads/:id/statistics - Get squad statistics
router.get('/:id/statistics', squadController.getStatistics.bind(squadController));

export default router;
