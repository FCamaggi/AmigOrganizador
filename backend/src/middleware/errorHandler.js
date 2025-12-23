/**
 * Middleware global de manejo de errores
 */
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Error de validación de Mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors
        });
    }

    // Error de duplicado de Mongoose (código 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `El ${field} ya está en uso`
        });
    }

    // Error de cast de Mongoose (ID inválido)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID inválido'
        });
    }

    // Error genérico
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
};

/**
 * Middleware para rutas no encontradas
 */
export const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
};
