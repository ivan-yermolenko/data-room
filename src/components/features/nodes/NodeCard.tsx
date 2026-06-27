import React, { useRef } from 'react';
import { Folder, FileText, MoreVertical } from 'lucide-react';
import { NodeType, type DataNode } from '@/types/dataroom';
import { useIsMobile } from '@/hooks/useIsMobile';

interface NodeCardProps {
  node: DataNode;
  onOpen: (node: DataNode) => void;
  onContextMenu: (node: DataNode, x: number, y: number) => void;
  isSelected?: boolean;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  onOpen,
  onContextMenu,
  isSelected = false,
}) => {
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  const handleDoubleClick = () => {
    onOpen(node);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(node, e.clientX, e.clientY);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      onContextMenu(node, rect.left, rect.bottom + 8);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      onOpen(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(node);
    }
  };

  const isFolder = node.type === NodeType.FOLDER;

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes < 0) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      tabIndex={0}
      role="button"
      aria-label={`${isFolder ? 'Folder' : 'File'} ${node.name}`}
      className={`group relative flex items-center justify-between p-4 bg-card border rounded-2xl transition-all select-none hover:shadow-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-muted-foreground/30'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {isFolder ? (
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Folder className="h-5 w-5 fill-amber-500/20" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 fill-blue-500/20" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate" title={node.name}>
            {node.name}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isFolder ? 'Folder' : formatBytes(node.size)}
          </p>
        </div>
      </div>

      <button
        ref={moreButtonRef}
        onClick={handleMoreClick}
        onKeyDown={(e) => e.stopPropagation()}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0 ml-2"
        title="More actions"
        aria-label="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
};
