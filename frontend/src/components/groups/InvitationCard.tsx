import { useState } from 'react';
import type { Invitation } from '../../services/invitationService';
import { useGroupStore } from '../../store/groupStore';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
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

  const statusBadge = () => {
    if (isExpired && isPending) return <Badge variant="neutral">Expirada</Badge>;
    if (invitation.status === 'accepted') return <Badge variant="success">Aceptada</Badge>;
    if (invitation.status === 'rejected') return <Badge variant="danger">Rechazada</Badge>;
    return <Badge variant="warning">Pendiente</Badge>;
  };

  const daysUntilExpiration = Math.ceil(
    (new Date(invitation.expiresAt).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <article className="rounded-pebble bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            name={invitation.invitedBy.fullName || invitation.invitedBy.username}
            size="lg"
          />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-neutral-950 sm:text-lg">
              {invitation.group.name}
            </h3>
            <p className="truncate text-sm text-neutral-600">
              Invitado por{' '}
              <strong>{invitation.invitedBy.fullName || invitation.invitedBy.username}</strong>
            </p>
          </div>
        </div>
        {statusBadge()}
      </div>

      {invitation.group.description && (
        <p className="mt-4 line-clamp-2 text-sm text-neutral-600">
          {invitation.group.description}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-600">
        <div className="rounded-xl bg-surface-low px-3 py-2">
          <span className="block font-bold text-neutral-900">
            {invitation.group.memberCount}
          </span>
          miembros
        </div>
        <div className="rounded-xl bg-surface-low px-3 py-2">
          <span className="block font-bold text-neutral-900">
            {isPending && !isExpired ? `${daysUntilExpiration} dias` : 'Cerrada'}
          </span>
          vigencia
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-3 py-2">
        <span className="text-xs font-bold uppercase text-neutral-500">Codigo</span>
        <code className="amig-time-code text-sm font-bold text-primary-700">
          {invitation.code}
        </code>
      </div>

      {isPending && !isExpired && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            aria-label={`Rechazar invitacion a ${invitation.group.name}`}
            onClick={handleReject}
            variant="ghost"
            disabled={isLoading}
            className="min-h-11 text-danger-600 hover:bg-danger-50"
          >
            Rechazar
          </Button>
          <Button
            aria-label={`Aceptar invitacion a ${invitation.group.name}`}
            onClick={handleAccept}
            disabled={isLoading}
            loading={isLoading}
            className="min-h-11"
          >
            Aceptar
          </Button>
        </div>
      )}
    </article>
  );
};

export default InvitationCard;
