import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Sync open state and bind event listeners
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }

      const handleCancel = (event: Event) => {
        // Prevent default browser-side synchronous close to let React state manage it
        event.preventDefault();
        onCloseRef.current();
      };

      const handleLightDismiss = (event: MouseEvent) => {
        // If clicked exactly on the dialog element itself (which is the backdrop area, since the inner container box is smaller)
        if (event.target === dialog) {
          onCloseRef.current();
        }
      };

      dialog.addEventListener('cancel', handleCancel);
      dialog.addEventListener('click', handleLightDismiss);

      return () => {
        dialog.removeEventListener('cancel', handleCancel);
        dialog.removeEventListener('click', handleLightDismiss);
      };
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      className={`border-0 bg-transparent outline-none backdrop:bg-background/80 backdrop:backdrop-blur-sm fixed inset-0 z-50 items-center justify-center p-4 ${
        isOpen ? 'flex' : 'hidden'
      }`}
    >
      <div className="bg-card text-card-foreground border border-border w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col max-h-[90vh] outline-none animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-2 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 id="modal-title" className="text-lg font-bold text-foreground">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {isOpen && children}
        </div>
      </div>
    </dialog>
  );
};
