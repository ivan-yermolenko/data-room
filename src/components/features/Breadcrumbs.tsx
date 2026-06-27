import React from 'react';
import { useDataroomStore } from '@/store/useDataroomStore';
import { NodeType } from '@/types/dataroom';
import { ChevronRight, Home, Folder } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const { rooms, currentRoomId, currentFolderId, nodes, setCurrentFolder } = useDataroomStore();

  const currentRoom = rooms.find(r => r.id === currentRoomId);

  const path: { id: string | null; name: string }[] = [];

  if (currentRoom) {
    path.push({ id: null, name: currentRoom.name });

    if (currentFolderId) {
      const folderPath: { id: string | null; name: string }[] = [];
      let currentId: string | null = currentFolderId;

      // Safe guard against infinite loops in corrupt parent trees
      const visited = new Set<string>();

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const node = nodes.find(n => n.id === currentId && n.type === NodeType.FOLDER);
        if (node) {
          folderPath.push({ id: node.id, name: node.name });
          currentId = node.parentId;
        } else {
          break;
        }
      }

      // Reverse to get correct order: Room Root -> Folder 1 -> Folder 2
      path.push(...folderPath.reverse());
    }
  }

  if (path.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 py-3 px-6 bg-background text-sm font-medium text-muted-foreground select-none border-b border-border">
      {path.map((item, index) => {
        const isLast = index === path.length - 1;
        return (
          <React.Fragment key={item.id ?? 'root'}>
            {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />}

            <button
              onClick={() => setCurrentFolder(item.id)}
              disabled={isLast}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                isLast
                  ? 'text-foreground font-semibold cursor-default'
                  : 'hover:bg-accent hover:text-foreground cursor-pointer'
              }`}
            >
              {index === 0 ? (
                <Home className="h-4 w-4 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate max-w-[120px] sm:max-w-[200px]">{item.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
