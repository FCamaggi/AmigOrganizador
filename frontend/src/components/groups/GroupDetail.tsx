import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import Navbar from '../layout/Navbar';
import Button from '../common/Button';
import Input from '../common/Input';
import GroupAvailabilityView from './GroupAvailabilityView';
import type { CreateInvitationData } from '../../services/invitationService';

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentGroup,
    invitations,
    isLoading,
    error,
    fetchGroupById,
    fetchGroupInvitations,
    createInvitation,
    updateGroup,
    deleteGroup,
    leaveGroup,
    removeMember,
    cancelInvitation,
  } = useGroupStore();

  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'availability'>(
    'details'
  );
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  useEffect(() => {
    if (id) {
      fetchGroupById(id);
      fetchGroupInvitations(id);
    }
  }, [id, fetchGroupById, fetchGroupInvitations]);

  useEffect(() => {
    if (currentGroup) {
      setEditForm({
        name: currentGroup.name,
        description: currentGroup.description || '',
        isPrivate: currentGroup.settings.isPrivate,
      });
    }
  }, [currentGroup]);

  if (isLoading && !currentGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Grupo no encontrado</p>
          <Button onClick={() => navigate('/groups')}>Volver a grupos</Button>
        </div>
      </div>
    );
  }

  const isCreator = user?._id === currentGroup.creator._id;
  const userMember = currentGroup.members.find((m) => m.user._id === user?._id);
  const isAdmin = userMember?.role === 'admin';

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !id) return;

    setIsInviting(true);
    try {
      const invitationData: CreateInvitationData = {
        groupId: id,
        email: inviteEmail.trim(),
      };
      await createInvitation(invitationData);
      setInviteEmail('');
      if (id) {
        await fetchGroupInvitations(id);
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    await updateGroup(id, editForm);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (
      !window.confirm(
        '¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }
    await deleteGroup(id);
    navigate('/groups');
  };

  const handleLeave = async () => {
    if (!id) return;
    if (!window.confirm('¿Estás seguro de que quieres salir de este grupo?')) {
      return;
    }
    await leaveGroup(id);
    navigate('/groups');
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    if (
      !window.confirm('¿Estás seguro de que quieres eliminar a este miembro?')
    ) {
      return;
    }
    await removeMember(id, userId);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await cancelInvitation(invitationId);
  };

  const groupInvitations = invitations.filter(
    (inv: (typeof invitations)[0]) => inv.group._id === id
  );
  const pendingInvitations = groupInvitations.filter(
    (inv: (typeof groupInvitations)[0]) => inv.status === 'pending'
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Back Button */}
          <Link
            to="/groups"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 font-semibold"
          >
            <span>←</span> Volver a grupos
          </Link>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Group Header */}
          <div className="bg-white rounded-2xl shadow-soft p-8 mb-6">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Nombre del grupo"
                  label="Nombre"
                  required
                />
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    placeholder="Descripción del grupo"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={editForm.isPrivate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isPrivate: e.target.checked })
                    }
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor="isPrivate"
                    className="text-sm text-neutral-700"
                  >
                    Grupo privado
                  </label>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveEdit} disabled={isLoading}>
                    {isLoading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-800 mb-2">
                      {currentGroup.name}
                    </h1>
                    {currentGroup.description && (
                      <p className="text-neutral-600">
                        {currentGroup.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isCreator && (
                      <span className="px-4 py-2 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                        Creador
                      </span>
                    )}
                    {!isCreator && isAdmin && (
                      <span className="px-4 py-2 bg-accent-100 text-accent-700 text-sm font-semibold rounded-full">
                        Admin
                      </span>
                    )}
                    {currentGroup.settings.isPrivate && (
                      <span className="px-4 py-2 bg-neutral-100 text-neutral-600 text-sm font-semibold rounded-full">
                        🔒 Privado
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-neutral-500">
                        CÓDIGO DEL GRUPO:
                      </span>
                      <code className="px-4 py-2 bg-neutral-100 text-primary-600 font-mono font-bold text-lg rounded-lg">
                        {currentGroup.code}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <Button
                          variant="secondary"
                          onClick={() => setIsEditing(true)}
                        >
                          Editar
                        </Button>
                      )}
                      {isCreator ? (
                        <Button
                          variant="secondary"
                          onClick={handleDelete}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Eliminar grupo
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={handleLeave}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Salir del grupo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-neutral-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-3 px-2 font-semibold transition-colors relative ${
                  activeTab === 'details'
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Detalles del grupo
                {activeTab === 'details' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`pb-3 px-2 font-semibold transition-colors relative ${
                  activeTab === 'availability'
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Disponibilidad grupal
                {activeTab === 'availability' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <>
              {/* Members Section */}
              <div className="bg-white rounded-2xl shadow-soft p-8 mb-6">
                <h2 className="text-xl font-bold text-neutral-800 mb-4">
                  Miembros ({currentGroup.memberCount})
                </h2>
                <div className="space-y-3">
                  {currentGroup.members.map((member) => (
                    <div
                      key={member.user._id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-bold">
                          {member.user.fullName?.[0]?.toUpperCase() ||
                            member.user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-800">
                            {member.user.fullName || member.user.email}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-neutral-600">
                          {member.role === 'admin'
                            ? 'Administrador'
                            : 'Miembro'}
                        </span>
                        {isAdmin &&
                          member.user._id !== user?._id &&
                          member.role !== 'admin' && (
                            <button
                              onClick={() =>
                                handleRemoveMember(member.user._id)
                              }
                              className="text-red-600 hover:text-red-700 text-sm font-semibold"
                            >
                              Eliminar
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Members Section */}
              {isAdmin && (
                <div className="bg-white rounded-2xl shadow-soft p-8 mb-6">
                  <h2 className="text-xl font-bold text-neutral-800 mb-4">
                    Invitar miembros
                  </h2>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="email"
                        name="inviteEmail"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@ejemplo.com"
                        label="Email del usuario"
                      />
                    </div>
                    <Button
                      onClick={handleInvite}
                      disabled={isInviting || !inviteEmail.trim()}
                      className="mt-7"
                    >
                      {isInviting ? 'Invitando...' : 'Enviar invitación'}
                    </Button>
                  </div>

                  {pendingInvitations.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                        Invitaciones pendientes ({pendingInvitations.length})
                      </h3>
                      <div className="space-y-2">
                        {pendingInvitations.map(
                          (invitation: (typeof pendingInvitations)[0]) => (
                            <div
                              key={invitation._id}
                              className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-semibold text-neutral-800">
                                  {invitation.invitedUser?.email ||
                                    invitation.invitedEmail}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Código:{' '}
                                  <code className="font-mono font-bold">
                                    {invitation.code}
                                  </code>
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleCancelInvitation(invitation._id)
                                }
                                className="text-red-600 hover:text-red-700 text-sm font-semibold"
                              >
                                Cancelar
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && id && currentGroup && (
            <GroupAvailabilityView groupId={id} groupName={currentGroup.name} />
          )}
        </div>
      </div>
    </>
  );
};

export default GroupDetail;
