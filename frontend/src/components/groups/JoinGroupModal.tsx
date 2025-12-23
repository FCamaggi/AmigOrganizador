import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Convertir a mayúsculas y limitar a 6 caracteres
    const value = e.target.value.toUpperCase().slice(0, 6);
    setCode(value);
    clearError();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (code.length !== 6) {
      return;
    }

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
      title="Unirse a Grupo"
      size="sm"
      footer={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={loading}
            className="w-full sm:flex-1 justify-center"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={code.length !== 6}
            className="w-full sm:flex-1 justify-center"
            onClick={(e) => {
              e.preventDefault();
              const form = document.getElementById('join-group-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
          >
            Unirse
          </Button>
        </div>
      }
    >
      <form id="join-group-form" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="mb-4 sm:mb-6">
          <Input
            label="Código del Grupo"
            type="text"
            name="code"
            value={code}
            onChange={handleChange}
            placeholder="ABC123"
            required
          />
          <p className="text-xs sm:text-sm text-neutral-500 mt-2">
            Ingresa el código de 6 caracteres del grupo al que deseas unirte
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default JoinGroupModal;
