import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { NodeType, type DataNode } from '@/types/dataroom';
import { sentryService } from '@/services/sentry';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: DataNode | null;
  onSubmit: (newName: string) => Promise<void>;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  node,
  onSubmit,
}) => {
  const [renameInput, setRenameInput] = useState(node ? node.name : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = renameInput.trim();
    if (!trimmedName || !node) return;

    try {
      await onSubmit(trimmedName);
      onClose();
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to rename node from Modal submit', nodeId: node.id, newName: trimmedName });
    }
  };

  const isFolder = node?.type === NodeType.FOLDER;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFolder ? "Rename Folder" : "Rename File"}
      description="Enter a new name for this item."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label
            htmlFor="rename-node-name"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
          >
            New Name
          </label>
          <input
            id="rename-node-name"
            type="text"
            required
            autoComplete="off"
            placeholder="Enter name"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
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
            className="px-5 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/95 transition-colors cursor-pointer"
          >
            Rename
          </button>
        </div>
      </form>
    </Modal>
  );
};
