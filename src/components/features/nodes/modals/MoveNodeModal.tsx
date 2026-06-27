import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { NodeType, type DataNode } from '@/types/dataroom';
import { Folder, Home, ChevronRight } from 'lucide-react';
import { sentryService } from '@/services/sentry';
import { isDescendant } from '@/utils/nodeHelpers';

interface MoveNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: DataNode | null;
  nodes: DataNode[];
  onSubmit: (targetParentId: string | null) => Promise<void>;
}

export const MoveNodeModal: React.FC<MoveNodeModalProps> = ({
  isOpen,
  onClose,
  node,
  nodes,
  onSubmit,
}) => {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFolderDepth = (parentId: string | null): number => {
    let depth = 0;
    let currentId = parentId;
    const visited = new Set<string>();
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const parent = nodes.find(n => n.id === currentId);
      currentId = parent ? parent.parentId : null;
      depth++;
    }
    return depth;
  };

  const folderTree = useMemo(() => {
    const allFolders = nodes.filter((n) => n.type === NodeType.FOLDER);

    const buildTree = (parentId: string | null, result: DataNode[] = []): DataNode[] => {
      const levelFolders = allFolders.filter((f) => f.parentId === parentId);
      levelFolders.sort((a, b) => a.name.localeCompare(b.name));

      for (const folder of levelFolders) {
        result.push(folder);
        buildTree(folder.id, result);
      }
      return result;
    };

    return buildTree(null);
  }, [nodes]);

  const handleMoveSubmit = async () => {
    if (!node) return;
    setIsSubmitting(true);
    try {
      await onSubmit(selectedParentId);
      onClose();
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to move node from MoveNodeModal', nodeId: node.id, targetParentId: selectedParentId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!node) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Move "${node.name}"`}
      description="Choose a destination folder for this item."
      size="md"
    >
      <div className="space-y-4 py-2">
        <div className="max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-muted/20">
          {/* Root Destination Option */}
          <button
            onClick={() => setSelectedParentId(null)}
            className={`w-full text-left p-3.5 flex items-center justify-between transition-all cursor-pointer ${
              selectedParentId === null
                ? 'bg-primary/5 text-primary font-semibold'
                : 'hover:bg-accent text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className="h-4.5 w-4.5 text-muted-foreground" />
              <span className="text-sm">Main Room Directory (Root)</span>
            </div>
            {selectedParentId === null && <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Indented Subfolders List */}
          {folderTree.map((folder) => {
            const isSelf = folder.id === node.id;
            const isSubfolder = node.type === NodeType.FOLDER && isDescendant(nodes, node.id, folder.id);
            const isDisabled = isSelf || isSubfolder;
            const depth = getFolderDepth(folder.parentId);

            return (
              <button
                key={folder.id}
                disabled={isDisabled}
                onClick={() => setSelectedParentId(folder.id)}
                style={{ paddingLeft: `${Math.max(14, (depth + 1) * 16)}px` }}
                className={`w-full text-left p-3.5 flex items-center justify-between transition-all cursor-pointer ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-accent/30 text-muted-foreground'
                    : selectedParentId === folder.id
                    ? 'bg-primary/5 text-primary font-semibold'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Folder className={`h-4.5 w-4.5 shrink-0 ${isDisabled ? 'text-muted-foreground/50' : 'text-amber-500 fill-amber-500/10'}`} />
                  <span className="text-sm truncate" title={folder.name}>{folder.name}</span>
                  {isSelf && <span className="text-[10px] bg-accent border border-border text-muted-foreground px-1.5 py-0.5 rounded-md font-medium shrink-0 ml-1.5">Current</span>}
                </div>
                {!isDisabled && selectedParentId === folder.id && <ChevronRight className="h-4 w-4 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl hover:bg-accent text-sm font-semibold transition-all cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || node.parentId === selectedParentId}
            onClick={handleMoveSubmit}
            className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            {isSubmitting ? 'Moving...' : 'Move Here'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
