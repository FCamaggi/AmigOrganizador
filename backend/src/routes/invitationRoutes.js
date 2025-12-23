import express from 'express';
import * as invitationController from '../controllers/invitationController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

/**
 * @route   POST /api/invitations
 * @desc    Crear invitación a grupo
 * @access  Private
 */
router.post('/', invitationController.createInvitation);

/**
 * @route   GET /api/invitations/my
 * @desc    Obtener invitaciones del usuario actual
 * @access  Private
 */
router.get('/my', invitationController.getMyInvitations);

/**
 * @route   GET /api/invitations/group/:groupId
 * @desc    Obtener invitaciones de un grupo
 * @access  Private (solo miembros del grupo)
 */
router.get('/group/:groupId', invitationController.getGroupInvitations);

/**
 * @route   POST /api/invitations/:id/accept
 * @desc    Aceptar invitación
 * @access  Private
 */
router.post('/:id/accept', invitationController.acceptInvitation);

/**
 * @route   POST /api/invitations/:id/reject
 * @desc    Rechazar invitación
 * @access  Private
 */
router.post('/:id/reject', invitationController.rejectInvitation);

/**
 * @route   DELETE /api/invitations/:id
 * @desc    Cancelar invitación
 * @access  Private (quien envió la invitación o admin del grupo)
 */
router.delete('/:id', invitationController.cancelInvitation);

export default router;
