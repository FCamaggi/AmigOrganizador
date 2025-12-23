import { useState } from 'react';
import type { Invitation } from '../../services/invitationService';
import { useGroupStore } from '../../store/groupStore';
import Button from '../common/Button';

interface InvitationCardProps {
  invitation: Invitation;
}

const InvitationCard = ({ invitation }: InvitationCardProps) => {
  const { acceptInvitation, rejectInvitation } = useGroupStore();
  const [isLoading, setIsLoading] = useState(false);

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isPending = invitation.status === 'pending';

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await acceptInvitation(invitation._id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectInvitation(invitation._id);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isExpired && invitation.status === 'pending') {
      return (
        <span className="px-3 py-1 bg-neutral-200 text-neutral-600 text-xs font-semibold rounded-full">
          Expirada
        </span>
      );
    }

    switch (invitation.status) {
      case 'accepted':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            Aceptada
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
            Rechazada
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            Pendiente
          </span>
        );
      default:
        return null;
    }
  };

  const daysUntilExpiration = Math.ceil(
    (new Date(invitation.expiresAt).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6">
      <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-neutral-800 mb-1 truncate">
            {invitation.group.name}
          </h3>
          {invitation.group.description && (
            <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2">
              {invitation.group.description}
            </p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-neutral-600">
          <span className="text-base sm:text-lg">👤</span>
          <span className="truncate">
            Invitado por{' '}
            <strong>
              {invitation.invitedBy.fullName || invitation.invitedBy.username}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-neutral-600">
          <span className="text-base sm:text-lg">👥</span>
          <span>
            {invitation.group.memberCount}{' '}
            {invitation.group.memberCount === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
        {isPending && !isExpired && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-neutral-600">
            <span className="text-base sm:text-lg">⏰</span>
            <span>
              Expira en {daysUntilExpiration}{' '}
              {daysUntilExpiration === 1 ? 'día' : 'días'}
            </span>
          </div>
        )}
      </div>

      <div className="pt-3 sm:pt-4 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">
              CÓDIGO:
            </span>
            <code className="px-2 sm:px-3 py-1 bg-neutral-100 text-primary-600 font-mono font-bold text-xs sm:text-sm rounded-lg">
              {invitation.code}
            </code>
          </div>
          <span className="text-xs text-neutral-400">
            {new Date(invitation.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      </div>

      {isPending && !isExpired && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="w-full sm:flex-1 min-h-[44px]"
          >
            {isLoading ? 'Aceptando...' : 'Aceptar'}
          </Button>
          <Button
            onClick={handleReject}
            variant="secondary"
            disabled={isLoading}
            className="w-full sm:flex-1 min-h-[44px]"
          >
            Rechazar
          </Button>
        </div>
      )}
    </div>
  );
};

export default InvitationCard;
