import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { sentryService } from '@/services/sentry';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = folderName.trim();
    if (!trimmedName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedName);
      onClose();
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to create folder from Modal submit', folderName: trimmedName });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Folder"
      description="Create a new folder in this directory."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label
            htmlFor="create-folder-name"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
          >
            Folder Name
          </label>
          <input
            id="create-folder-name"
            type="text"
            required
            autoFocus
            autoComplete="off"
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full text-sm bg-background border border-input rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground font-medium rounded-xl hover:bg-accent transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/95 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
