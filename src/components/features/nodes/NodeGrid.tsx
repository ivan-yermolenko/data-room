import React, { useState, useMemo } from 'react';
import { FolderOpen, FileText } from 'lucide-react';
import { NodeType, type DataNode } from '@/types/dataroom';
import { NodeCard } from './NodeCard';
import { NodeContextMenu } from './NodeContextMenu';

interface NodeGridProps {
  nodes: DataNode[];
  currentFolderId: string | null;
  searchQuery: string;
  onNodeOpen: (node: DataNode) => void;
  onRenameClick: (node: DataNode) => void;
  onDeleteClick: (node: DataNode) => void;
}

interface ContextMenuState {
  node: DataNode;
  x: number;
  y: number;
}

export const NodeGrid: React.FC<NodeGridProps> = ({
  nodes,
  currentFolderId,
  searchQuery,
  onNodeOpen,
  onRenameClick,
  onDeleteClick,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const isSearching = searchQuery.trim().length > 0;
  const lowercaseQuery = searchQuery.toLowerCase();

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (isSearching) {
        return node.name.toLowerCase().includes(lowercaseQuery);
      } else {
        return node.parentId === currentFolderId;
      }
    });
  }, [nodes, isSearching, lowercaseQuery, currentFolderId]);

  const { folders, files } = useMemo(() => {
    const foldersList = filteredNodes.filter((node) => node.type === NodeType.FOLDER);
    const filesList = filteredNodes.filter((node) => node.type === NodeType.FILE);
    return { folders: foldersList, files: filesList };
  }, [filteredNodes]);

  const handleContextMenu = (node: DataNode, x: number, y: number) => {
    setContextMenu({ node, x, y });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  if (filteredNodes.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground select-none">
        {isSearching ? (
          <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-sm max-w-sm">
            <div className="h-12 w-12 rounded-xl bg-accent text-muted-foreground flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground mb-1">No results found</p>
            <p className="text-xs">No files or folders matched "{searchQuery}"</p>
          </div>
        ) : (
          <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-sm max-w-sm">
            <div className="h-12 w-12 rounded-xl bg-accent text-muted-foreground flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground mb-1">This folder is empty</p>
            <p className="text-xs">Upload files or create folders to get started</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none relative h-full">
      {isSearching && (
        <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-1">
          Search Results for "{searchQuery}" ({filteredNodes.length} items)
        </div>
      )}

      {/* Folders Section */}
      {!isSearching && folders.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3.5 px-1">
            Folders
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                onOpen={onNodeOpen}
                onContextMenu={handleContextMenu}
                isSelected={contextMenu?.node.id === node.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {!isSearching && files.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3.5 px-1">
            Files
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                onOpen={onNodeOpen}
                onContextMenu={handleContextMenu}
                isSelected={contextMenu?.node.id === node.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Flattened Search View (displays both folders and files in a single grid when searching) */}
      {isSearching && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onOpen={onNodeOpen}
              onContextMenu={handleContextMenu}
              isSelected={contextMenu?.node.id === node.id}
            />
          ))}
        </div>
      )}

      {/* Context Menu Overlay */}
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={handleCloseContextMenu}
          onRename={onRenameClick}
          onDelete={onDeleteClick}
        />
      )}
    </div>
  );
};
