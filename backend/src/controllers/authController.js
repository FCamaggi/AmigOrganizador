import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
export const register = async (req, res) => {
    try {
        const { email, password, username, fullName } = req.body;

        // Verificar si el usuario ya existe (email o username)
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    success: false,
                    message: 'El username ya está en uso'
                });
            }
        }

        // Crear nuevo usuario
        const user = new User({
            email,
            password,
            username,
            fullName
        });

        await user.save();

        // Generar token JWT
        const token = generateToken(user._id);

        // Actualizar último login
        user.lastLogin = new Date();
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Error en register:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        // Buscar usuario por email o username
        const user = await User.findOne({
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { username: emailOrUsername }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = generateToken(user._id);

        // Actualizar último login
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Obtener usuario actual
 * @access  Private
 */
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Error en getCurrentUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (cliente debe eliminar token)
 * @access  Private
 */
export const logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
};
