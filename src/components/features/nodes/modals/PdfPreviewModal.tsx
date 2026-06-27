import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { type DataNode } from '@/types/dataroom';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: DataNode | null;
  previewUrl: string | null;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  node,
  previewUrl,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={node?.name || 'File Preview'}
      description="Previewing uploaded PDF document."
      size="4xl"
    >
      <div className="flex flex-col h-full mt-2">
        {previewUrl && (
          <iframe
            src={previewUrl}
            title={node?.name}
            className="w-full h-[70vh] rounded-xl border border-border bg-muted shrink-0"
          />
        )}
        <div className="flex justify-end mt-4">
          {previewUrl && (
            <a
              href={previewUrl}
              download={node?.name}
              className="px-5 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/95 transition-colors cursor-pointer flex items-center gap-2"
            >
              Download File
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
};
