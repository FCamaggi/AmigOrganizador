import UserTemplate from '../models/UserTemplate.js';

/**
 * Obtener todas las plantillas del usuario
 * GET /api/user-templates
 */
export const getUserTemplates = async (req, res) => {
    try {
        const userId = req.userId;

        let templates = await UserTemplate.find({ user: userId }).sort({ order: 1 });

        // Si el usuario no tiene plantillas, crear las por defecto
        if (templates.length === 0) {
            templates = await UserTemplate.createDefaultTemplates(userId);
        }

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Error al obtener plantillas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener plantillas',
            error: error.message
        });
    }
};

/**
 * Crear una nueva plantilla personalizada
 * POST /api/user-templates
 */
export const createUserTemplate = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, category, color, defaultSlots } = req.body;

        if (!name || !category || !color) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, categoría y color son requeridos'
            });
        }

        // Obtener el orden máximo actual
        const maxOrder = await UserTemplate.findOne({ user: userId })
            .sort({ order: -1 })
            .select('order');

        const template = await UserTemplate.create({
            user: userId,
            name,
            category,
            color,
            defaultSlots: defaultSlots || [],
            isDefault: false,
            order: maxOrder ? maxOrder.order + 1 : 1
        });

        res.status(201).json({
            success: true,
            data: template,
            message: 'Plantilla creada exitosamente'
        });
    } catch (error) {
        console.error('Error al crear plantilla:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear plantilla',
            error: error.message
        });
    }
};

/**
 * Actualizar una plantilla
 * PUT /api/user-templates/:id
 */
export const updateUserTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const updateData = req.body;

        const template = await UserTemplate.findOne({ _id: id, user: userId });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }

        // Actualizar campos permitidos
        const allowedFields = ['name', 'category', 'color', 'defaultSlots', 'order'];
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                template[field] = updateData[field];
            }
        });

        await template.save();

        res.json({
            success: true,
            data: template,
            message: 'Plantilla actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar plantilla:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar plantilla',
            error: error.message
        });
    }
};

/**
 * Eliminar una plantilla
 * DELETE /api/user-templates/:id
 */
export const deleteUserTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const template = await UserTemplate.findOneAndDelete({ _id: id, user: userId });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Plantilla eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar plantilla:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar plantilla',
            error: error.message
        });
    }
};

/**
 * Reordenar plantillas
 * PUT /api/user-templates/reorder
 */
export const reorderUserTemplates = async (req, res) => {
    try {
        const userId = req.userId;
        const { templateIds } = req.body; // Array de IDs en el nuevo orden

        if (!Array.isArray(templateIds)) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de IDs de plantillas'
            });
        }

        // Actualizar el orden de cada plantilla
        const updatePromises = templateIds.map((templateId, index) =>
            UserTemplate.updateOne(
                { _id: templateId, user: userId },
                { order: index + 1 }
            )
        );

        await Promise.all(updatePromises);

        const templates = await UserTemplate.find({ user: userId }).sort({ order: 1 });

        res.json({
            success: true,
            data: templates,
            message: 'Plantillas reordenadas exitosamente'
        });
    } catch (error) {
        console.error('Error al reordenar plantillas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al reordenar plantillas',
            error: error.message
        });
    }
};
