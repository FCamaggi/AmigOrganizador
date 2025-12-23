import { Link } from 'react-router-dom';
import type { Group } from '../../services/groupService';
import { useAuthStore } from '../../store/authStore';

interface GroupCardProps {
  group: Group;
}

const GroupCard = ({ group }: GroupCardProps) => {
  const { user } = useAuthStore();

  const isCreator = user?._id === group.creator._id;
  const userMember = group.members.find((m) => m.user._id === user?._id);
  const isAdmin = userMember?.role === 'admin';

  return (
    <Link
      to={`/groups/${group._id}`}
      className="block bg-white rounded-xl sm:rounded-2xl shadow-soft hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-4 sm:p-6"
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-neutral-800 mb-1 truncate">
            {group.name}
          </h3>
          {group.description && (
            <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2">
              {group.description}
            </p>
          )}
        </div>
        {isCreator && (
          <span className="flex-shrink-0 px-2 sm:px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full whitespace-nowrap">
            Creador
          </span>
        )}
        {!isCreator && isAdmin && (
          <span className="flex-shrink-0 px-2 sm:px-3 py-1 bg-accent-100 text-accent-700 text-xs font-semibold rounded-full whitespace-nowrap">
            Admin
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-600 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-base sm:text-lg">👥</span>
          <span>
            {group.memberCount}{' '}
            {group.memberCount === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
        {group.settings.isPrivate && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg">🔒</span>
            <span>Privado</span>
          </div>
        )}
      </div>

      <div className="pt-3 sm:pt-4 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">
              CÓDIGO:
            </span>
            <code className="px-2 sm:px-3 py-1 bg-neutral-100 text-primary-600 font-mono font-bold text-xs sm:text-sm rounded-lg">
              {group.code}
            </code>
          </div>
          <span className="text-xs text-neutral-400">
            Creado{' '}
            {new Date(group.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;
