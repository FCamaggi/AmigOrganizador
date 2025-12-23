import express from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

/**
 * @route   GET /api/schedules/:year/:month
 * @desc    Obtener horario de un mes específico
 * @access  Private
 */
router.get('/:year/:month', scheduleController.getSchedule);

/**
 * @route   PUT /api/schedules/:year/:month/:day
 * @desc    Actualizar disponibilidad de un día
 * @access  Private
 */
router.put('/:year/:month/:day', scheduleController.updateDayAvailability);

/**
 * @route   DELETE /api/schedules/:year/:month/:day
 * @desc    Eliminar disponibilidad de un día
 * @access  Private
 */
router.delete('/:year/:month/:day', scheduleController.removeDayAvailability);

/**
 * @route   GET /api/schedules/range/:startYear/:startMonth/:endYear/:endMonth
 * @desc    Obtener horarios de múltiples meses
 * @access  Private
 */
router.get('/range/:startYear/:startMonth/:endYear/:endMonth', scheduleController.getScheduleRange);

/**
 * @route   GET /api/schedules/:year/:month/export
 * @desc    Exportar horario a JSON
 * @access  Private
 */
router.get('/:year/:month/export', scheduleController.exportSchedule);

/**
 * @route   POST /api/schedules/import
 * @desc    Importar horario desde JSON
 * @access  Private
 */
router.post('/import', scheduleController.importSchedule);

export default router;
