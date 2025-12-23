import Group from '../models/Group.js';
import Invitation from '../models/Invitation.js';
import User from '../models/User.js';

/**
 * Crear un nuevo grupo
 * POST /api/groups
 */
export const createGroup = async (req, res) => {
    try {
        const { name, description, isPrivate } = req.body;
        const userId = req.userId;

        // Validar nombre
        if (!name || name.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del grupo debe tener al menos 3 caracteres'
            });
        }

        // Generar código único de 6 caracteres
        const code = await Group.generateUniqueCode();

        // Crear grupo con el creador como admin
        const group = await Group.create({
            name: name.trim(),
            description: description?.trim() || '',
            code,
            creator: userId,
            members: [{
                user: userId,
                role: 'admin',
                joinedAt: new Date()
            }],
            settings: {
                isPrivate: isPrivate || false,
                allowMemberInvites: true
            }
        });

        // Populate para devolver información completa
        await group.populate('creator', 'username email fullName');
        await group.populate('members.user', 'username email fullName');

        res.status(201).json({
            success: true,
            data: group
        });
    } catch (error) {
        console.error('Error al crear grupo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear grupo',
            error: error.message
        });
    }
};

/**
 * Obtener todos los grupos del usuario
 * GET /api/groups
 */
export const getMyGroups = async (req, res) => {
    try {
        const userId = req.userId;

        const groups = await Group.find({
            'members.user': userId
        })
            .populate('creator', 'username email fullName')
            .populate('members.user', 'username email fullName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: groups
        });
    } catch (error) {
        console.error('Error al obtener grupos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener grupos',
            error: error.message
        });
    }
};

/**
 * Obtener un grupo por ID
 * GET /api/groups/:id
 */
export const getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findById(id)
            .populate('creator', 'username email fullName')
            .populate('members.user', 'username email fullName');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        // Verificar que el usuario sea miembro del grupo
        const isMember = group.members.some(member => {
            const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
            return memberId === userId.toString();
        });

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este grupo'
            });
        }

        res.json({
            success: true,
            data: group
        });
    } catch (error) {
        console.error('Error al obtener grupo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener grupo',
            error: error.message
        });
    }
};

/**
 * Unirse a un grupo por código
 * POST /api/groups/join/:code
 */
export const joinGroupByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.userId;

        const group = await Group.findOne({ code: code.toUpperCase() })
            .populate('creator', 'username email fullName')
            .populate('members.user', 'username email fullName');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado con ese código'
            });
        }

        // Verificar si ya es miembro
        const isMember = group.members.some(member => {
            const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
            return memberId === userId.toString();
        });

        if (isMember) {
            return res.status(400).json({
                success: false,
                message: 'Ya eres miembro de este grupo'
            });
        }

        // Agregar como miembro
        await group.addMember(userId, 'member');
        await group.populate('members.user', 'username email fullName');

        res.json({
            success: true,
            data: group,
            message: 'Te has unido al grupo exitosamente'
        });
    } catch (error) {
        console.error('Error al unirse al grupo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al unirse al grupo',
            error: error.message
        });
    }
};

/**
 * Actualizar información del grupo
 * PUT /api/groups/:id
 */
export const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isPrivate, allowMemberInvites } = req.body;
        const userId = req.userId;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        // Solo admins pueden actualizar el grupo
        if (!group.isAdmin(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden actualizar el grupo'
            });
        }

        // Actualizar campos
        if (name) group.name = name.trim();
        if (description !== undefined) group.description = description.trim();
        if (isPrivate !== undefined) group.settings.isPrivate = isPrivate;
        if (allowMemberInvites !== undefined) group.settings.allowMemberInvites = allowMemberInvites;

        await group.save();
        await group.populate('creator', 'username email fullName');
        await group.populate('members.user', 'username email fullName');

        res.json({
            success: true,
            data: group
        });
    } catch (error) {
        console.error('Error al actualizar grupo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar grupo',
            error: error.message
        });
    }
};

/**
 * Eliminar grupo
 * DELETE /api/groups/:id
 */
export const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        // Solo el creador puede eliminar el grupo
        if (group.creator.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Solo el creador puede eliminar el grupo'
            });
        }

        // Eliminar todas las invitaciones del grupo
        await Invitation.deleteMany({ group: id });

        // Eliminar grupo
        await group.deleteOne();

        res.json({
            success: true,
            message: 'Grupo eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar grupo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar grupo',
            error: error.message
        });
    }
};


/**
 * Remover miembro del grupo
 * DELETE /api/groups/:id/members/:memberId
 */
export const removeMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.userId;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        // Solo admins pueden remover miembros
        if (!group.isAdmin(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden remover miembros'
            });
        }

        // No se puede remover al creador
        if (group.creator.toString() === memberId) {
            return res.status(400).json({
                success: false,
                message: 'No se puede remover al creador del grupo'
            });
        }

        // Remover miembro
        await group.removeMember(memberId);
        await group.populate('members.user', 'username email fullName');

        res.json({
            success: true,
            data: group,
            message: 'Miembro removido exitosamente'
        });
    } catch (error) {
        console.error('Error al remover miembro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al remover miembro',
            error: error.message
        });
    }
};

/**
 * Salirse de un grupo
 * POST /api/groups/:id/leave
 */
export const leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const group = await Group.findById(id)
            .populate('creator', 'username email fullName')
            .populate('members.user', 'username email fullName');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        // Verificar si el usuario es creador
        if (group.creator._id.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'El creador del grupo no puede salirse. Elimina el grupo en su lugar.'
            });
        }

        // Verificar si el usuario es miembro
        const isMember = group.members.some(member => {
            const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
            return memberId === userId.toString();
        });

        if (!isMember) {
            return res.status(400).json({
                success: false,
                message: 'No eres miembro de este grupo'
            });
        }

        // Remover del grupo
        await group.removeMember(userId);
        await group.populate('members.user', 'username email fullName');

        res.json({
            success: true,
            data: group,
            message: 'Te has salido del grupo exitosamente'
        });
    } catch (error) {
        console.error('Error al salir del grupo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al salir del grupo',
            error: error.message
        });
    }
};
