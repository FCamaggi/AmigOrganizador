import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useGroupStore } from '../../store/groupStore';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const JoinGroupModal = ({
  isOpen,
  onClose,
  onSuccess,
}: JoinGroupModalProps) => {
  const { joinGroupByCode, loading, error, clearError } = useGroupStore();
  const [code, setCode] = useState('');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(value);
    clearError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (code.length !== 6) return;

    try {
      await joinGroupByCode(code);
      setCode('');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unirse con codigo"
      description="Pega el codigo de 6 caracteres que te compartieron."
      size="sm"
      headerGradient
    >
      <form id="join-group-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm font-medium text-danger-700">
            {error}
          </div>
        )}

        <Input
          label="Codigo del grupo"
          type="text"
          name="code"
          value={code}
          onChange={handleChange}
          placeholder="ABC123"
          required
          variant="glass"
          className="amig-time-code text-center text-2xl font-bold tracking-normal"
          hint="Usa exactamente 6 letras o numeros."
        />

        <div className="rounded-2xl bg-surface-low p-4 text-sm text-neutral-600">
          Al unirte podras ver miembros, disponibilidad grupal y eventos que
          calzan con los mejores horarios del grupo.
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={loading}
            fullWidth
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={code.length !== 6}
            fullWidth
          >
            Unirse
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default JoinGroupModal;
