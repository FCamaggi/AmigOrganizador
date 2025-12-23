import Invitation from '../models/Invitation.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

/**
 * Crear invitación a grupo
 * POST /api/invitations
 */
export const createInvitation = async (req, res) => {
    try {
        const { groupId, email, message } = req.body;
        const userId = req.userId;

        // Validar datos
        if (!groupId || !email) {
            return res.status(400).json({
                success: false,
                message: 'Grupo y email son requeridos'
            });
        }

        // Verificar que el grupo existe
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        // Verificar permisos
        if (!group.isAdmin(userId) && !group.settings.allowMemberInvites) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para invitar miembros a este grupo'
            });
        }

        // Verificar que el email no sea del creador de la invitación
        const inviter = await User.findById(userId);
        if (inviter.email.toLowerCase() === email.toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: 'No puedes invitarte a ti mismo'
            });
        }

        // Buscar si el usuario existe
        const invitedUser = await User.findOne({ email: email.toLowerCase() });

        // Verificar si el usuario ya es miembro
        if (invitedUser && group.isMember(invitedUser._id)) {
            return res.status(400).json({
                success: false,
                message: 'Este usuario ya es miembro del grupo'
            });
        }

        // Verificar si ya existe una invitación pendiente
        const existingInvitation = await Invitation.findOne({
            group: groupId,
            invitedEmail: email.toLowerCase(),
            status: 'pending'
        });

        if (existingInvitation && !existingInvitation.isExpired()) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una invitación pendiente para este email'
            });
        }

        // Crear invitación con expiración de 7 días
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await Invitation.create({
            group: groupId,
            invitedBy: userId,
            invitedUser: invitedUser?._id || null,
            invitedEmail: email.toLowerCase(),
            message: message || '',
            expiresAt
        });

        // Populate para respuesta completa
        await invitation.populate('group', 'name code');
        await invitation.populate('invitedBy', 'username email fullName');
        if (invitedUser) {
            await invitation.populate('invitedUser', 'username email fullName');
        }

        res.status(201).json({
            success: true,
            data: invitation
        });
    } catch (error) {
        console.error('Error al crear invitación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear invitación',
            error: error.message
        });
    }
};

/**
 * Obtener invitaciones del usuario actual
 * GET /api/invitations/my
 */
export const getMyInvitations = async (req, res) => {
    try {
        const userId = req.userId;

        // Buscar invitaciones por email del usuario
        const user = await User.findById(userId);

        const invitations = await Invitation.find({
            $or: [
                { invitedUser: userId },
                { invitedEmail: user.email }
            ],
            status: 'pending'
        })
            .populate('group', 'name code description')
            .populate('invitedBy', 'username email fullName')
            .sort({ createdAt: -1 });

        // Filtrar las expiradas
        const validInvitations = invitations.filter(inv => !inv.isExpired());

        res.json({
            success: true,
            data: validInvitations
        });
    } catch (error) {
        console.error('Error al obtener invitaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener invitaciones',
            error: error.message
        });
    }
};

/**
 * Obtener invitaciones enviadas de un grupo
 * GET /api/invitations/group/:groupId
 */
export const getGroupInvitations = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.userId;

        // Verificar que el grupo existe y el usuario es miembro
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Grupo no encontrado'
            });
        }

        if (!group.isMember(userId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este grupo'
            });
        }

        const invitations = await Invitation.find({ group: groupId })
            .populate('invitedBy', 'username email fullName')
            .populate('invitedUser', 'username email fullName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: invitations
        });
    } catch (error) {
        console.error('Error al obtener invitaciones del grupo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener invitaciones del grupo',
            error: error.message
        });
    }
};

/**
 * Aceptar invitación
 * POST /api/invitations/:id/accept
 */
export const acceptInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const invitation = await Invitation.findById(id)
            .populate('group');

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitación no encontrada'
            });
        }

        // Verificar que la invitación es para este usuario
        const user = await User.findById(userId);
        if (invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'Esta invitación no es para ti'
            });
        }

        // Aceptar invitación
        await invitation.accept(userId);

        // Agregar usuario al grupo
        const group = await Group.findById(invitation.group._id);
        await group.addMember(userId, 'member');
        await group.populate('members.user', 'username email fullName');

        res.json({
            success: true,
            data: {
                invitation,
                group
            },
            message: 'Invitación aceptada exitosamente'
        });
    } catch (error) {
        console.error('Error al aceptar invitación:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al aceptar invitación'
        });
    }
};

/**
 * Rechazar invitación
 * POST /api/invitations/:id/reject
 */
export const rejectInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const invitation = await Invitation.findById(id);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitación no encontrada'
            });
        }

        // Verificar que la invitación es para este usuario
        const user = await User.findById(userId);
        if (invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'Esta invitación no es para ti'
            });
        }

        await invitation.reject();

        res.json({
            success: true,
            message: 'Invitación rechazada'
        });
    } catch (error) {
        console.error('Error al rechazar invitación:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al rechazar invitación'
        });
    }
};

/**
 * Cancelar invitación (por quien la envió)
 * DELETE /api/invitations/:id
 */
export const cancelInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const invitation = await Invitation.findById(id);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitación no encontrada'
            });
        }

        // Verificar que el usuario sea quien envió la invitación o admin del grupo
        const group = await Group.findById(invitation.group);
        if (invitation.invitedBy.toString() !== userId.toString() && !group.isAdmin(userId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para cancelar esta invitación'
            });
        }

        await invitation.deleteOne();

        res.json({
            success: true,
            message: 'Invitación cancelada exitosamente'
        });
    } catch (error) {
        console.error('Error al cancelar invitación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar invitación',
            error: error.message
        });
    }
};
