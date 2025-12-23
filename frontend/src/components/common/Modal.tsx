import { useEffect, useRef } from 'react';
import { cn } from '../../styles/design-system';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
  headerGradient?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-full mx-2 sm:mx-4',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  headerGradient = false,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full my-auto',
          'max-h-[95vh] sm:max-h-[90vh] overflow-hidden',
          'animate-in zoom-in-95 slide-in-from-bottom-4 duration-200',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || description || showCloseButton) && (
          <div
            className={cn(
              'px-4 sm:px-6 py-3 sm:py-5 border-b border-neutral-200 flex items-start justify-between',
              headerGradient &&
                'bg-gradient-to-r from-primary-600 to-accent-500 text-white border-none'
            )}
          >
            <div className="flex-1 pr-2">
              {title && (
                <h2
                  className={cn(
                    'text-lg sm:text-2xl font-bold',
                    headerGradient ? 'text-white' : 'text-neutral-800'
                  )}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  className={cn(
                    'mt-1 text-xs sm:text-sm',
                    headerGradient ? 'text-white/90' : 'text-neutral-600'
                  )}
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'ml-2 sm:ml-4 p-1 sm:p-1.5 rounded-lg transition-colors flex-shrink-0',
                  headerGradient
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                )}
                aria-label="Cerrar"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-180px)] px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-200 bg-neutral-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
