import { Router } from 'express';
import { EmpresaController } from '../controllers/empresa.controller';
import { authenticateToken } from '../middlewares/auth';
import { requireAdminMaster } from '../middlewares/permissions';

const router = Router();
const empresaController = new EmpresaController();

// Apply authentication to all routes
router.use(authenticateToken);

// Admin Master only routes
router.use(requireAdminMaster);

// GET /api/empresas - List all empresas
router.get('/', empresaController.getAll.bind(empresaController));

// GET /api/empresas/:id - Get empresa by ID
router.get('/:id', empresaController.getById.bind(empresaController));

// POST /api/empresas - Create new empresa
router.post('/', empresaController.create.bind(empresaController));

// PUT /api/empresas/:id - Update empresa
router.put('/:id', empresaController.update.bind(empresaController));

// DELETE /api/empresas/:id - Delete empresa
router.delete('/:id', empresaController.delete.bind(empresaController));

// GET /api/empresas/:id/statistics - Get empresa statistics
router.get('/:id/statistics', empresaController.getStatistics.bind(empresaController));

export default router;
