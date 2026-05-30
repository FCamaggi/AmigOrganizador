import { useEffect, useState } from 'react';
import { useGroupStore } from '../../store/groupStore';
import Button from '../common/Button';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import Skeleton from '../common/Skeleton';
import Navbar from '../layout/Navbar';
import CreateGroupModal from './CreateGroupModal';
import GroupCard from './GroupCard';
import InvitationCard from './InvitationCard';
import JoinGroupModal from './JoinGroupModal';

const GroupsPage = () => {
  const {
    groups,
    invitations,
    isLoading,
    error,
    fetchMyGroups,
    fetchMyInvitations,
  } = useGroupStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'invitations'>('groups');

  useEffect(() => {
    fetchMyGroups();
    fetchMyInvitations();
  }, [fetchMyGroups, fetchMyInvitations]);

  const pendingInvitations = invitations.filter((invitation) => {
    const isExpired = new Date(invitation.expiresAt) < new Date();
    return invitation.status === 'pending' && !isExpired;
  });

  const tabClass = (tab: 'groups' | 'invitations') =>
    `min-h-11 rounded-xl px-4 text-sm font-bold transition-all ${
      activeTab === tab
        ? 'bg-white text-primary-700 shadow-soft'
        : 'text-neutral-600 hover:bg-white/70'
    }`;

  return (
    <>
      <Navbar />
      <main className="amig-cosmic-canvas min-h-screen pb-28 pt-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <header className="space-y-5">
            <div>
              <p className="text-sm font-bold uppercase text-primary-700">
                Coordinacion compartida
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-neutral-950 sm:text-5xl">
                Mis Grupos
              </h1>
              <p className="mt-2 max-w-2xl text-base text-neutral-700">
                Organiza, planifica y conecta con tu gente sin perder de vista
                disponibilidad, codigos e invitaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={() => setIsJoinModalOpen(true)}
                variant="secondary"
                fullWidth
                className="justify-center"
              >
                Unirse con codigo
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                fullWidth
                className="justify-center"
              >
                Crear nuevo grupo
              </Button>
            </div>
          </header>

          {pendingInvitations.length > 0 && activeTab === 'groups' && (
            <Card variant="glass" padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-warning-700">
                  Invitaciones pendientes
                </p>
                <h2 className="mt-1 text-xl font-bold text-neutral-950">
                  Tienes {pendingInvitations.length}{' '}
                  {pendingInvitations.length === 1
                    ? 'grupo esperando respuesta'
                    : 'grupos esperando respuesta'}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Revisa quien te invito y acepta solo los grupos que quieras sumar.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setActiveTab('invitations')}
                className="shrink-0"
              >
                Ver invitaciones
              </Button>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/50 p-1 backdrop-blur">
            <button className={tabClass('groups')} onClick={() => setActiveTab('groups')}>
              Grupos ({groups.length})
            </button>
            <button
              className={tabClass('invitations')}
              onClick={() => setActiveTab('invitations')}
            >
              Invitaciones ({pendingInvitations.length})
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} padding="lg">
                  <Skeleton className="h-28 w-full" rounded="lg" />
                  <Skeleton className="mt-5 h-7 w-2/3" rounded="md" />
                  <Skeleton className="mt-3 h-4 w-full" rounded="md" />
                  <Skeleton className="mt-2 h-4 w-4/5" rounded="md" />
                </Card>
              ))}
            </div>
          ) : activeTab === 'groups' ? (
            groups.length === 0 ? (
              <EmptyState
                title="Aun no tienes grupos"
                description="Crea un grupo nuevo o entra con un codigo para empezar a cruzar disponibilidad."
                actionLabel="Crear mi primer grupo"
                onAction={() => setIsCreateModalOpen(true)}
              />
            ) : (
              <section
                aria-label="Lista de grupos"
                className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                {groups.map((group) => (
                  <GroupCard key={group._id} group={group} />
                ))}
              </section>
            )
          ) : invitations.length === 0 ? (
            <EmptyState
              title="No tienes invitaciones"
              description="Cuando alguien te invite a un grupo, aparecera aqui con sus acciones."
            />
          ) : (
            <section
              aria-label="Invitaciones de grupos"
              className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {invitations.map((invitation) => (
                <InvitationCard key={invitation._id} invitation={invitation} />
              ))}
            </section>
          )}
        </div>

        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
        <JoinGroupModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
        />
      </main>
    </>
  );
};

export default GroupsPage;
