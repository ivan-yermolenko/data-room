import React, { useState, useMemo } from 'react';
import { FolderOpen, FileText, Loader2 } from 'lucide-react';
import { NodeType, type DataNode, type FilterType, type SortByType } from '@/types/dataroom';
import { NodeCard } from './NodeCard';
import { NodeContextMenu } from './NodeContextMenu';
import { NodeFilters } from './NodeFilters';
import { sortNodes } from '@/utils/nodeSorting';

interface NodeGridProps {
  nodes: DataNode[];
  currentFolderId: string | null;
  searchQuery: string;
  isSearchingActive?: boolean;
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
  isSearchingActive = false,
  onNodeOpen,
  onRenameClick,
  onDeleteClick,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortByType>('name-asc');

  const isSearching = searchQuery.trim().length > 0;
  const lowercaseQuery = searchQuery.toLowerCase();

  // 1. Initial filter based on search query or current navigation folder ID
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (isSearching) {
        // Global search within active room matching query
        return node.name.toLowerCase().includes(lowercaseQuery);
      } else {
        return node.parentId === currentFolderId;
      }
    });
  }, [nodes, isSearching, lowercaseQuery, currentFolderId]);

  const typeFilteredNodes = useMemo(() => {
    return filteredNodes.filter((node) => {
      if (filterType === 'folders') return node.type === NodeType.FOLDER;
      if (filterType === 'files') return node.type === NodeType.FILE;
      return true;
    });
  }, [filteredNodes, filterType]);

  const sortedNodes = useMemo(() => {
    return sortNodes(typeFilteredNodes, sortBy);
  }, [typeFilteredNodes, sortBy]);

  const { sortedFolders, sortedFiles } = useMemo(() => {
    const foldersList = sortedNodes.filter((node) => node.type === NodeType.FOLDER);
    const filesList = sortedNodes.filter((node) => node.type === NodeType.FILE);
    return { sortedFolders: foldersList, sortedFiles: filesList };
  }, [sortedNodes]);

  const handleContextMenu = (node: DataNode, x: number, y: number) => {
    setContextMenu({ node, x, y });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div className="flex flex-col h-full select-none relative">
      <NodeFilters
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {isSearching && (
        <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-4">
          Search Results for "{searchQuery}" ({sortedNodes.length} items)
        </div>
      )}

      {/* Grid Content */}
      {isSearchingActive ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Searching...</span>
          </div>
        </div>
      ) : sortedNodes.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
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
              <p className="font-semibold text-foreground mb-1">No items found</p>
              <p className="text-xs">
                {filterType === 'all'
                  ? 'Upload files or create folders to get started'
                  : `No ${filterType} available in this directory`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 flex-1">
          {/* Folders Section (Only show separate headers if filter is 'all' and not searching) */}
          {!isSearching && filterType === 'all' && sortedFolders.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3.5 px-1">
                Folders ({sortedFolders.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedFolders.map((node) => (
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

          {/* Files Section (Only show separate headers if filter is 'all' and not searching) */}
          {!isSearching && filterType === 'all' && sortedFiles.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3.5 px-1">
                Files ({sortedFiles.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedFiles.map((node) => (
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

          {/* Unified/Flattened Grid View (used when filtering for folders/files only, or when searching) */}
          {((!isSearching && filterType !== 'all') || isSearching) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedNodes.map((node) => (
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
        </div>
      )}

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
