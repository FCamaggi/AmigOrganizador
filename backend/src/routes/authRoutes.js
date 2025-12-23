import express from 'express';
import { register, login, getCurrentUser, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Rutas protegidas
router.get('/me', auth, getCurrentUser);
router.post('/logout', auth, logout);

export default router;
