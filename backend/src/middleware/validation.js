import { body, validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validaciones para registro de usuario
 */
export const validateRegister = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/)
        .withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[0-9]/)
        .withMessage('La contraseña debe contener al menos un número'),
    body('username')
        .isLength({ min: 3, max: 20 })
        .withMessage('El username debe tener entre 3 y 20 caracteres')
        .matches(/^[a-zA-Z0-9]+$/)
        .withMessage('El username solo puede contener letras y números'),
    body('fullName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El nombre completo debe tener máximo 100 caracteres'),
    handleValidationErrors
];

/**
 * Validaciones para login
 */
export const validateLogin = [
    body('emailOrUsername')
        .notEmpty()
        .withMessage('Email o username es requerido')
        .trim(),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida'),
    handleValidationErrors
];
