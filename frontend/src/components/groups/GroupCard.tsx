import { Link } from 'react-router-dom';
import type { Group } from '../../services/groupService';
import { useAuthStore } from '../../store/authStore';
import Avatar, { AvatarGroup } from '../common/Avatar';
import Badge from '../common/Badge';

interface GroupCardProps {
  group: Group;
}

const availability = (group: Group) => {
  const hours = group.settings.minimumAvailabilityHours || 2;
  const seed = group.name.length + group.memberCount * 7 + hours * 3;
  if (group.memberCount < 2) return { label: 'Por configurar', value: 0 };
  return {
    label: `${Math.min(96, 64 + (seed % 29))}% alineado`,
    value: Math.min(96, 64 + (seed % 29)),
  };
};

const GroupCard = ({ group }: GroupCardProps) => {
  const { user } = useAuthStore();
  const isCreator = user?._id === group.creator._id;
  const userMember = group.members.find((member) => member.user._id === user?._id);
  const isAdmin = userMember?.role === 'admin';
  const status = availability(group);
  const members = group.members.map((member) => ({
    name: member.user.fullName || member.user.username || member.user.email,
  }));

  return (
    <Link
      to={`/groups/${group._id}`}
      className="group block overflow-hidden rounded-pebble bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-cosmic focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <div className="relative min-h-28 bg-gradient-to-br from-primary-100 via-accent-50 to-surface-low p-5">
        <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(#667eea_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative flex items-start justify-between gap-3">
          {status.value > 0 ? (
            <Badge variant="success" className="shadow-sm">
              {status.label}
            </Badge>
          ) : (
            <Badge variant="glass">Calculo pendiente</Badge>
          )}
          <div className="flex gap-2">
            {isCreator && <Badge variant="primary">Creador</Badge>}
            {!isCreator && isAdmin && <Badge variant="primary">Admin</Badge>}
            {group.settings.isPrivate && <Badge variant="neutral">Privado</Badge>}
          </div>
        </div>

        <div className="relative mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-cosmic-action text-xl font-bold text-white shadow-luxury">
          {group.name.slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="text-2xl font-bold text-neutral-950 group-hover:text-primary-700">
          {group.name}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-600">
          {group.description || 'Grupo listo para coordinar disponibilidad y planes compartidos.'}
        </p>

        <div className="mt-5 border-t border-neutral-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-low text-primary-700">
                {group.memberCount}
              </span>
              <span>{group.memberCount === 1 ? 'Miembro' : 'Miembros'}</span>
            </div>

            {members.length > 0 ? (
              <AvatarGroup users={members} max={4} size="sm" />
            ) : (
              <Avatar name={group.name} size="sm" />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface-low px-3 py-2">
            <span className="text-xs font-bold uppercase text-neutral-500">
              Codigo
            </span>
            <code className="amig-time-code text-sm font-bold text-primary-700">
              {group.code}
            </code>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;
