import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const duplicateUserError = (field) => ({
    success: false,
    message: field === 'email'
        ? 'El email ya está registrado'
        : 'El username ya está en uso',
    errors: [{
        field,
        message: field === 'email'
            ? 'Este email ya está registrado'
            : 'Este username ya está en uso'
    }]
});

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
export const register = async (req, res) => {
    try {
        const { email, password, username, fullName, registrationRequestId } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.trim();
        const normalizedRequestId = registrationRequestId?.trim();

        if (normalizedRequestId) {
            const previousRegistration = await User.findOne({
                registrationRequestId: normalizedRequestId
            }).select('+registrationRequestId');

            if (previousRegistration) {
                if (
                    previousRegistration.email !== normalizedEmail ||
                    previousRegistration.username !== normalizedUsername
                ) {
                    return res.status(409).json({
                        success: false,
                        message: 'Este intento de registro ya fue usado con otros datos'
                    });
                }

                const token = generateToken(previousRegistration._id);
                return res.status(200).json({
                    success: true,
                    message: 'Usuario registrado exitosamente',
                    token,
                    user: previousRegistration.toJSON()
                });
            }
        }

        // Verificar si el usuario ya existe (email o username)
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
        });

        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                return res.status(409).json(duplicateUserError('email'));
            }
            if (existingUser.username === normalizedUsername) {
                return res.status(409).json(duplicateUserError('username'));
            }
        }

        // Crear nuevo usuario
        const user = new User({
            email: normalizedEmail,
            password,
            username: normalizedUsername,
            fullName: fullName?.trim(),
            registrationRequestId: normalizedRequestId,
            lastLogin: new Date()
        });

        await user.save();

        // Generar token JWT
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Error en register:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
            if (field === 'email' || field === 'username') {
                return res.status(409).json(duplicateUserError(field));
            }
            if (field === 'registrationRequestId' && req.body.registrationRequestId) {
                const previousRegistration = await User.findOne({
                    registrationRequestId: req.body.registrationRequestId.trim()
                }).select('+registrationRequestId');

                if (previousRegistration) {
                    const token = generateToken(previousRegistration._id);
                    return res.status(200).json({
                        success: true,
                        message: 'Usuario registrado exitosamente',
                        token,
                        user: previousRegistration.toJSON()
                    });
                }
            }
        }

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
