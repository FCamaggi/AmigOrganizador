import express from 'express';
import * as userTemplateController from '../controllers/userTemplateController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

/**
 * @route   GET /api/user-templates
 * @desc    Obtener todas las plantillas del usuario
 * @access  Private
 */
router.get('/', userTemplateController.getUserTemplates);

/**
 * @route   POST /api/user-templates
 * @desc    Crear nueva plantilla personalizada
 * @access  Private
 */
router.post('/', userTemplateController.createUserTemplate);

/**
 * @route   PUT /api/user-templates/reorder
 * @desc    Reordenar plantillas
 * @access  Private
 */
router.put('/reorder', userTemplateController.reorderUserTemplates);

/**
 * @route   PUT /api/user-templates/:id
 * @desc    Actualizar plantilla
 * @access  Private
 */
router.put('/:id', userTemplateController.updateUserTemplate);

/**
 * @route   DELETE /api/user-templates/:id
 * @desc    Eliminar plantilla
 * @access  Private
 */
router.delete('/:id', userTemplateController.deleteUserTemplate);

export default router;
