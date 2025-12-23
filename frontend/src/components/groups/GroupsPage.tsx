import { useEffect, useState } from 'react';
import { useGroupStore } from '../../store/groupStore';
import Navbar from '../layout/Navbar';
import Button from '../common/Button';
import GroupCard from './GroupCard';
import InvitationCard from './InvitationCard';
import CreateGroupModal from './CreateGroupModal';
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
  const [activeTab, setActiveTab] = useState<'groups' | 'invitations'>(
    'groups'
  );

  useEffect(() => {
    fetchMyGroups();
    fetchMyInvitations();
  }, [fetchMyGroups, fetchMyInvitations]);

  const pendingInvitations = invitations.filter(
    (inv: (typeof invitations)[0]) => {
      const isExpired = new Date(inv.expiresAt) < new Date();
      return inv.status === 'pending' && !isExpired;
    }
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-1 sm:mb-2">
                  Mis Grupos
                </h1>
                <p className="text-sm sm:text-base text-neutral-600">
                  Organiza horarios compartidos con tus amigos y colegas
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={() => setIsJoinModalOpen(true)}
                  variant="secondary"
                  className="w-full sm:w-auto justify-center"
                >
                  <span className="mr-2">🔍</span>
                  Unirse con código
                </Button>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto justify-center">
                  <span className="mr-2">➕</span>
                  Crear grupo
                </Button>
              </div>
            </div>
          </div>

          {/* Pending Invitations Alert */}
          {pendingInvitations.length > 0 && activeTab === 'groups' && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <div className="flex items-start sm:items-center gap-3 flex-1">
                <span className="text-xl sm:text-2xl flex-shrink-0">📨</span>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-amber-900">
                    Tienes {pendingInvitations.length}{' '}
                    {pendingInvitations.length === 1
                      ? 'invitación pendiente'
                      : 'invitaciones pendientes'}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-700">
                    Revisa tus invitaciones para unirte a nuevos grupos
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setActiveTab('invitations')}
                className="w-full sm:w-auto whitespace-nowrap justify-center"
              >
                Ver invitaciones
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-4 sm:mb-6 border-b border-neutral-200 overflow-x-auto">
            <div className="flex gap-4 sm:gap-6 lg:gap-8 min-w-max">
              <button
                onClick={() => setActiveTab('groups')}
                className={`pb-2 sm:pb-3 px-1 sm:px-2 text-sm sm:text-base font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'groups'
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Grupos ({groups.length})
                {activeTab === 'groups' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`pb-2 sm:pb-3 px-1 sm:px-2 text-sm sm:text-base font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'invitations'
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Invitaciones ({invitations.length})
                {pendingInvitations.length > 0 && (
                  <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                    {pendingInvitations.length}
                  </span>
                )}
                {activeTab === 'invitations' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500" />
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-sm sm:text-base text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <>
              {activeTab === 'groups' && (
                <div>
                  {groups.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">👥</div>
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-700 mb-2">
                        No tienes grupos todavía
                      </h3>
                      <p className="text-sm sm:text-base text-neutral-500 mb-4 sm:mb-6 px-4">
                        Crea un grupo o únete a uno existente con un código
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-4">
                        <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto justify-center">
                          Crear mi primer grupo
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setIsJoinModalOpen(true)}
                          className="w-full sm:w-auto justify-center"
                        >
                          Unirse con código
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                      {groups.map((group) => (
                        <GroupCard key={group._id} group={group} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'invitations' && (
                <div>
                  {invitations.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📨</div>
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-700 mb-2">
                        No tienes invitaciones
                      </h3>
                      <p className="text-sm sm:text-base text-neutral-500 px-4">
                        Cuando alguien te invite a un grupo, aparecerá aquí
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                      {invitations.map(
                        (invitation: (typeof invitations)[0]) => (
                          <InvitationCard
                            key={invitation._id}
                            invitation={invitation}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
        <JoinGroupModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
        />
      </div>
    </>
  );
};

export default GroupsPage;
