import React, { useEffect, useRef } from 'react';
import { Pencil, Trash2, Folder } from 'lucide-react';
import { type DataNode } from '@/types/dataroom';

interface NodeContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: (node: DataNode) => void;
  onDelete: (node: DataNode) => void;
  onMove?: (node: DataNode) => void;
  node: DataNode;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  x,
  y,
  onClose,
  onRename,
  onDelete,
  onMove,
  node,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuWidth = 160;
  const menuHeight = onMove ? 130 : 90;
  const adjustedX = Math.max(16, Math.min(x, window.innerWidth - menuWidth - 16));
  const adjustedY = Math.max(16, Math.min(y, window.innerHeight - menuHeight - 16));

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      role="menu"
      className="fixed bg-popover text-popover-foreground border border-border rounded-xl shadow-lg py-1.5 z-50 w-40 animate-in fade-in zoom-in-95 duration-100 outline-none select-none"
    >
      <button
        onClick={() => {
          onRename(node);
          onClose();
        }}
        role="menuitem"
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent text-left font-medium transition-colors cursor-pointer outline-none focus:bg-accent"
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Rename</span>
      </button>

      {onMove && (
        <button
          onClick={() => {
            onMove(node);
            onClose();
          }}
          role="menuitem"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent text-left font-medium transition-colors cursor-pointer outline-none focus:bg-accent"
        >
          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Move to...</span>
        </button>
      )}

      <div className="h-px bg-border my-1" />

      <button
        onClick={() => {
          onDelete(node);
          onClose();
        }}
        role="menuitem"
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent text-destructive hover:text-destructive/90 text-left font-medium transition-colors cursor-pointer outline-none focus:bg-accent"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive/80" />
        <span>Delete</span>
      </button>
    </div>
  );
};
