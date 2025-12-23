import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

/**
 * @route   GET /api/events/availability/:date
 * @desc    Obtener disponibilidad para una fecha específica
 * @access  Private
 */
router.get('/availability/:date', eventController.getAvailabilityForDate);

/**
 * @route   POST /api/events
 * @desc    Crear nuevo evento
 * @access  Private
 */
router.post('/', eventController.createEvent);

/**
 * @route   GET /api/events
 * @desc    Obtener eventos del usuario (con filtros opcionales)
 * @access  Private
 */
router.get('/', eventController.getEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Obtener evento por ID
 * @access  Private
 */
router.get('/:id', eventController.getEventById);

/**
 * @route   PUT /api/events/:id
 * @desc    Actualizar evento
 * @access  Private
 */
router.put('/:id', eventController.updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Eliminar evento
 * @access  Private
 */
router.delete('/:id', eventController.deleteEvent);

export default router;
