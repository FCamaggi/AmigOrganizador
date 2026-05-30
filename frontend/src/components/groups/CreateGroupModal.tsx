import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useGroupStore } from '../../store/groupStore';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import Textarea from '../common/Textarea';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateGroupModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateGroupModalProps) => {
  const { createGroup, loading } = useGroupStore();
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setValidationError('');

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (formData.name.trim().length < 3) {
      setValidationError('El nombre del grupo debe tener al menos 3 caracteres.');
      return;
    }

    try {
      await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isPrivate: formData.isPrivate,
      });

      setFormData({ name: '', description: '', isPrivate: false });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear nuevo grupo"
      description="Define el espacio donde vas a cruzar disponibilidad y planes."
      size="md"
      headerGradient
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {validationError && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm font-medium text-danger-700">
            {validationError}
          </div>
        )}

        <Input
          label="Nombre del grupo"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Viaje a la playa"
          variant="glass"
          required
        />

        <Textarea
          label="Descripcion (opcional)"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe el objetivo del grupo..."
          maxLength={200}
          rows={3}
          variant="glass"
          hint={`${formData.description.length}/200 caracteres`}
        />

        <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
              className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              <span className="block text-sm font-semibold text-neutral-900">
                Grupo privado
              </span>
              <span className="mt-1 block text-xs text-neutral-500">
                Solo se puede unir por invitacion directa o codigo compartido.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full sm:w-auto"
          >
            Crear grupo
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;
