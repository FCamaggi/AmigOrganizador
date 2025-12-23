import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useGroupStore } from '../../store/groupStore';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-neutral-800">
              Crear Nuevo Grupo
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
          <Input
            label="Nombre del Grupo"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Mi grupo de amigos"
            required
          />

          <div className="mb-6">
            <label className="label-text">Descripción (opcional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe tu grupo..."
              maxLength={200}
              rows={3}
              className="input-field w-full resize-none"
            />
            <p className="text-sm text-neutral-500 mt-1">
              {formData.description.length}/200 caracteres
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-semibold text-neutral-700">
                  Grupo Privado
                </span>
                <p className="text-xs text-neutral-500">
                  Solo se puede unir por invitación
                </p>
              </div>
            </label>
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
            <Button type="submit" variant="primary" loading={loading}>
              Crear Grupo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
