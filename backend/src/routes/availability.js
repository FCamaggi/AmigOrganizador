import express from 'express';
import { getGroupAvailability } from '../controllers/availabilityController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

/**
 * GET /api/availability/group/:groupId
 * Obtener disponibilidad grupal para un mes específico
 * Query params: month, year
 */
router.get('/group/:groupId', getGroupAvailability);

export default router;
