import express from 'express';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

/**
 * GET /api/users/profile
 * Obtener perfil del usuario actual
 */
router.get('/profile', getProfile);

/**
 * PUT /api/users/profile
 * Actualizar perfil del usuario
 */
router.put('/profile', updateProfile);

/**
 * POST /api/users/change-password
 * Cambiar contraseña
 */
router.post('/change-password', changePassword);

/**
 * DELETE /api/users/account
 * Eliminar cuenta (requiere contraseña)
 */
router.delete('/account', deleteAccount);

export default router;
