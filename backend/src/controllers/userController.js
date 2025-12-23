import User from '../models/User.js';
import bcrypt from 'bcryptjs';

/**
 * Obtener perfil del usuario actual
 */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil del usuario'
        });
    }
};

/**
 * Actualizar perfil del usuario
 */
export const updateProfile = async (req, res) => {
    try {
        const { username, fullName, email } = req.body;
        const userId = req.userId;

        // Validar que no esté vacío
        if (!username || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username y email son requeridos'
            });
        }

        // Verificar si el email ya está en uso por otro usuario
        if (email) {
            const existingEmail = await User.findOne({
                email,
                _id: { $ne: userId }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está en uso'
                });
            }
        }

        // Verificar si el username ya está en uso por otro usuario
        if (username) {
            const existingUsername = await User.findOne({
                username,
                _id: { $ne: userId }
            });
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: 'El username ya está en uso'
                });
            }
        }

        // Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username, fullName, email },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'Perfil actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil'
        });
    }
};

/**
 * Cambiar contraseña
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        // Validar campos
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }

        // Validar longitud de nueva contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        // Obtener usuario con contraseña
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Hash de nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña'
        });
    }
};

/**
 * Eliminar cuenta de usuario
 */
export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.userId;

        // Validar contraseña
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña es requerida para eliminar la cuenta'
            });
        }

        // Obtener usuario con contraseña
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Eliminar usuario y sus datos relacionados
        // TODO: Implementar eliminación en cascada de schedules, groups, etc.
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: 'Cuenta eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar cuenta'
        });
    }
};
