import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useGroupStore } from '../../store/groupStore';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (formData.name.trim().length < 3) {
      alert('El nombre del grupo debe tener al menos 3 caracteres');
      return;
    }

    try {
      await createGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isPrivate: formData.isPrivate,
      });

      // Reset form
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
      title="Crear Nuevo Grupo"
      description="Organiza eventos con tus amigos o colegas"
      size="md"
      headerGradient
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 sm:space-y-6"
      >
        <Input
          label="Nombre del Grupo"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Mi grupo de amigos"
          required
        />

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe tu grupo..."
            maxLength={200}
            rows={3}
            className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all resize-none text-sm"
          />
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {formData.description.length}/200 caracteres
          </p>
        </div>

        <div>
          <label className="flex items-start sm:items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
              className="w-5 h-5 mt-0.5 sm:mt-0 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 flex-shrink-0"
            />
            <div>
              <span className="text-sm font-semibold text-neutral-700 block">
                Grupo Privado
              </span>
              <p className="text-xs text-neutral-500">
                Solo se puede unir por invitación
              </p>
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-4">
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
            Crear Grupo
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;
