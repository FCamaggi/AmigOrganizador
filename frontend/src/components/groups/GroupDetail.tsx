import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CreateInvitationData } from '../../services/invitationService';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import Input from '../common/Input';
import Skeleton from '../common/Skeleton';
import Textarea from '../common/Textarea';
import Navbar from '../layout/Navbar';
import GroupAvailabilityView from './GroupAvailabilityView';

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
  const [activeTab, setActiveTab] = useState<'details' | 'availability'>('details');
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
      <>
        <Navbar />
        <main className="amig-cosmic-canvas min-h-screen p-4 sm:p-8">
          <div className="mx-auto max-w-5xl space-y-5">
            <Skeleton className="h-64 w-full" rounded="lg" />
            <Skeleton className="h-16 w-full" rounded="lg" />
            <Skeleton className="h-28 w-full" rounded="lg" />
          </div>
        </main>
      </>
    );
  }

  if (!currentGroup) {
    return (
      <>
        <Navbar />
        <main className="amig-cosmic-canvas flex min-h-screen items-center justify-center p-4">
          <EmptyState
            title="Grupo no encontrado"
            description="Puede que el grupo haya sido eliminado o que ya no tengas acceso."
            actionLabel="Volver a grupos"
            onAction={() => navigate('/groups')}
          />
        </main>
      </>
    );
  }

  const activeMembers = currentGroup.members.filter((member) => member.user);
  const isCreator = user?._id === currentGroup.creator?._id;
  const userMember = activeMembers.find((member) => member.user._id === user?._id);
  const isAdmin = userMember?.role === 'admin';
  const groupInvitations = invitations.filter(
    (invitation) => invitation.group._id === id
  );
  const pendingInvitations = groupInvitations.filter(
    (invitation) => invitation.status === 'pending'
  );

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
      await fetchGroupInvitations(id);
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
        'Estas seguro de que quieres eliminar este grupo? Esta accion no se puede deshacer.'
      )
    ) {
      return;
    }
    await deleteGroup(id);
    navigate('/groups');
  };

  const handleLeave = async () => {
    if (!id) return;
    if (!window.confirm('Estas seguro de que quieres salir de este grupo?')) {
      return;
    }
    await leaveGroup(id);
    navigate('/groups');
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    if (!window.confirm('Estas seguro de que quieres eliminar a este miembro?')) {
      return;
    }
    await removeMember(id, userId);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await cancelInvitation(invitationId);
  };

  const tabClass = (tab: 'details' | 'availability') =>
    `relative min-h-11 px-2 text-base font-bold transition-colors ${
      activeTab === tab
        ? 'text-neutral-950'
        : 'text-neutral-500 hover:text-neutral-800'
    }`;

  return (
    <>
      <Navbar />
      <main className="amig-cosmic-canvas min-h-screen pb-28 pt-5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/groups"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-sm font-bold text-primary-700 shadow-soft transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span aria-hidden="true">←</span>
              Grupos
            </Link>
            {isAdmin && (
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Configurar
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
              {error}
            </div>
          )}

          <Card variant="glass" padding="xl" className="overflow-hidden">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm({ ...editForm, name: event.target.value })
                  }
                  placeholder="Nombre del grupo"
                  label="Nombre"
                  variant="glass"
                  required
                />
                <Textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({ ...editForm, description: event.target.value })
                  }
                  placeholder="Descripcion del grupo"
                  label="Descripcion"
                  variant="glass"
                  rows={3}
                />
                <label className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 text-sm font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={editForm.isPrivate}
                    onChange={(event) =>
                      setEditForm({ ...editForm, isPrivate: event.target.checked })
                    }
                    className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  Grupo privado
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={handleSaveEdit} loading={isLoading}>
                    Guardar cambios
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-end">
                <div>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {isCreator && <Badge variant="primary">Creador</Badge>}
                    {!isCreator && isAdmin && <Badge variant="primary">Admin</Badge>}
                    {currentGroup.settings.isPrivate && <Badge variant="neutral">Privado</Badge>}
                  </div>
                  <h1 className="text-4xl font-extrabold text-neutral-950 sm:text-6xl">
                    {currentGroup.name}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-neutral-700">
                    {currentGroup.description ||
                      'Grupo listo para coordinar miembros, disponibilidad y panoramas compatibles.'}
                  </p>
                  <p className="mt-5 text-lg font-semibold text-neutral-800">
                    {activeMembers.length}{' '}
                    {activeMembers.length === 1 ? 'miembro' : 'miembros'}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-soft">
                  <p className="text-xs font-bold uppercase text-neutral-500">
                    Codigo de union
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <code className="amig-time-code text-2xl font-bold text-primary-700">
                      {currentGroup.code}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(currentGroup.code)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700 transition hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label="Copiar codigo del grupo"
                    >
                      <span aria-hidden="true">[]</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 border-b border-neutral-200">
            <button className={tabClass('details')} onClick={() => setActiveTab('details')}>
              Detalles
              {activeTab === 'details' && (
                <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-cosmic-action" />
              )}
            </button>
            <button
              className={tabClass('availability')}
              onClick={() => setActiveTab('availability')}
            >
              Disponibilidad
              <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">
                Nuevo
              </span>
              {activeTab === 'availability' && (
                <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-cosmic-action" />
              )}
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <section aria-labelledby="members-title" className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 id="members-title" className="text-3xl font-extrabold text-neutral-950">
                    Miembros
                  </h2>
                  {isAdmin && (
                    <Button onClick={() => document.getElementById('inviteEmail')?.focus()}>
                      Invitar
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {activeMembers.map((member) => (
                    <Card
                      key={member.user._id}
                      variant="glass"
                      padding="md"
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <Avatar
                          name={member.user.fullName || member.user.username || member.user.email}
                          size="lg"
                          status={member.role === 'admin' ? 'online' : undefined}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-lg font-bold text-neutral-950">
                            {member.user.fullName || member.user.username || member.user.email}
                          </p>
                          <p className="truncate text-sm text-neutral-500">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <Badge variant={member.role === 'admin' ? 'primary' : 'neutral'}>
                          {member.role === 'admin' ? 'Administrador' : 'Miembro'}
                        </Badge>
                        {isAdmin &&
                          member.user._id !== user?._id &&
                          member.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.user._id)}
                              className="text-danger-600 hover:bg-danger-50"
                            >
                              Eliminar
                            </Button>
                          )}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <aside className="space-y-5">
                {isAdmin && (
                  <Card variant="glass" padding="lg">
                    <h2 className="text-xl font-bold text-neutral-950">
                      Invitar miembros
                    </h2>
                    <div className="mt-4">
                      <Input
                        id="inviteEmail"
                        type="email"
                        name="inviteEmail"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        placeholder="email@ejemplo.com"
                        label="Email del usuario"
                        variant="glass"
                      />
                      <Button
                        onClick={handleInvite}
                        disabled={isInviting || !inviteEmail.trim()}
                        loading={isInviting}
                        fullWidth
                      >
                        Enviar invitacion
                      </Button>
                    </div>

                    {pendingInvitations.length > 0 && (
                      <div className="mt-5 space-y-2">
                        <p className="text-xs font-bold uppercase text-neutral-500">
                          Pendientes ({pendingInvitations.length})
                        </p>
                        {pendingInvitations.map((invitation) => (
                          <div
                            key={invitation._id}
                            className="rounded-xl bg-white/75 p-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate font-semibold text-neutral-900">
                                {invitation.invitedUser?.email || invitation.invitedEmail}
                              </span>
                              <button
                                onClick={() => handleCancelInvitation(invitation._id)}
                                className="text-xs font-bold text-danger-600 hover:text-danger-700"
                              >
                                Cancelar
                              </button>
                            </div>
                            <code className="amig-time-code mt-1 block text-xs text-primary-700">
                              {invitation.code}
                            </code>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                <Card variant="glass" padding="lg">
                  <h2 className="text-xl font-bold text-neutral-950">
                    Acciones
                  </h2>
                  <div className="mt-4 grid gap-2">
                    {isCreator ? (
                      <Button variant="danger" onClick={handleDelete} fullWidth>
                        Eliminar grupo
                      </Button>
                    ) : (
                      <Button variant="danger" onClick={handleLeave} fullWidth>
                        Salir del grupo
                      </Button>
                    )}
                  </div>
                </Card>
              </aside>
            </div>
          ) : (
            id && <GroupAvailabilityView groupId={id} groupName={currentGroup.name} />
          )}
        </div>
      </main>
    </>
  );
};

export default GroupDetail;
