import express from 'express';
import * as groupController from '../controllers/groupController.js';
import * as groupAvailabilityController from '../controllers/groupAvailabilityController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

/**
 * @route   POST /api/groups
 * @desc    Crear nuevo grupo
 * @access  Private
 */
router.post('/', groupController.createGroup);

/**
 * @route   GET /api/groups
 * @desc    Obtener todos los grupos del usuario
 * @access  Private
 */
router.get('/', groupController.getMyGroups);

/**
 * @route   GET /api/groups/:id
 * @desc    Obtener grupo por ID
 * @access  Private (solo miembros)
 */
router.get('/:id', groupController.getGroupById);

/**
 * @route   POST /api/groups/join/:code
 * @desc    Unirse a grupo por código
 * @access  Private
 */
router.post('/join/:code', groupController.joinGroupByCode);

/**
 * @route   PUT /api/groups/:id
 * @desc    Actualizar grupo
 * @access  Private (solo admins)
 */
router.put('/:id', groupController.updateGroup);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Eliminar grupo
 * @access  Private (solo creador)
 */
router.delete('/:id', groupController.deleteGroup);

/**
 * @route   POST /api/groups/:id/leave
 * @desc    Salir del grupo
 * @access  Private (miembros excepto creador)
 */
router.post('/:id/leave', groupController.leaveGroup);

/**
 * @route   DELETE /api/groups/:id/members/:memberId
 * @desc    Remover miembro del grupo
 * @access  Private (solo admins)
 */
router.delete('/:id/members/:memberId', groupController.removeMember);

/**
 * @route   GET /api/groups/:id/availability/simple
 * @desc    Obtener vista simple de disponibilidad grupal (días con ventanas libres)
 * @access  Private (solo miembros)
 */
router.get('/:id/availability/simple', groupAvailabilityController.getSimpleAvailability);

/**
 * @route   GET /api/groups/:id/availability/detailed
 * @desc    Obtener vista detallada de disponibilidad grupal (horas exactas por día)
 * @access  Private (solo miembros)
 */
router.get('/:id/availability/detailed', groupAvailabilityController.getDetailedAvailability);

export default router;
