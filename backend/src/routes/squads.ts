import { Router } from 'express';
import { SquadController } from '../controllers/squad.controller';
import { SquadService } from '../services/squad.service';
import { SquadRepository } from '../repositories/squad.repository';
import { UserRepository } from '../repositories/user.repository';
import { ClienteRepository } from '../repositories/cliente.repository';
import { EmpresaRepository } from '../repositories/empresa.repository';
import { authenticateToken } from '../middlewares/auth';
import { requireAdminMaster, requireFuncionarioOrAdmin } from '../middlewares/permissions';
import { validateDto } from '../middlewares/validation';
import { AddFuncionarioToSquadRequestDto } from '../dtos/request/add-funcionario-to-squad.request.dto';
import { AddClienteToSquadRequestDto } from '../dtos/request/add-cliente-to-squad.request.dto';

const router = Router();

// Dependency Injection
const squadRepository = new SquadRepository();
const userRepository = new UserRepository();
const clienteRepository = new ClienteRepository();
const empresaRepository = new EmpresaRepository();
const squadService = new SquadService(squadRepository, userRepository, clienteRepository, empresaRepository);
const squadController = new SquadController(squadService);

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/squads - List squads (filtered by role)
router.get('/', squadController.getAll.bind(squadController));

// GET /api/squads/:id - Get squad by ID
router.get('/:id', squadController.getById.bind(squadController));

// GET /api/squads/:id/membros - List squad members
router.get('/:id/membros', squadController.getMembers.bind(squadController));

// GET /api/squads/:id/statistics - Get squad statistics
router.get('/:id/statistics', squadController.getStatistics.bind(squadController));

// Admin Master only routes (CRUD de squad)
router.post('/', requireAdminMaster, squadController.create.bind(squadController));
router.put('/:id', requireAdminMaster, squadController.update.bind(squadController));
router.delete('/:id', requireAdminMaster, squadController.delete.bind(squadController));

// Squad member management routes (Admin Master OU Funcionário da própria squad)
// A verificação de "própria squad" é feita no Service
router.post('/:id/funcionarios', requireFuncionarioOrAdmin, validateDto(AddFuncionarioToSquadRequestDto), squadController.addFuncionario.bind(squadController));
router.delete('/:id/funcionarios/:usuarioId', requireFuncionarioOrAdmin, squadController.removeFuncionario.bind(squadController));
router.post('/:id/clientes', requireFuncionarioOrAdmin, validateDto(AddClienteToSquadRequestDto), squadController.addCliente.bind(squadController));
router.delete('/:id/clientes/:clienteId', requireFuncionarioOrAdmin, squadController.removeCliente.bind(squadController));

export default router;
