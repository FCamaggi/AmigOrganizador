import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useGroupStore } from '../../store/groupStore';
import Button from '../common/Button';
import Input from '../common/Input';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-neutral-800">
              Unirse a Grupo
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl">
              {error}
            </div>
          )}

          <div className="mb-6">
            <Input
              label="Código del Grupo"
              type="text"
              name="code"
              value={code}
              onChange={handleChange}
              placeholder="ABC123"
              required
            />
            <p className="text-sm text-neutral-500 mt-2">
              Ingresa el código de 6 caracteres del grupo al que deseas unirte
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={code.length !== 6}
            >
              Unirse
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupModal;
