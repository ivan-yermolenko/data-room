import React, { useState } from 'react';
import { useDataroomStore } from '@/store/useDataroomStore';
import { FolderKanban, Plus, Trash2, FolderPlus, FileUp, X } from 'lucide-react';
import { sentryService } from '@/services/sentry';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface SidebarProps {
  onNewFolderClick: () => void;
  onUploadFileClick: () => void;
  onClose?: () => void;
}

interface PendingDeleteRoom {
  id: string;
  name: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewFolderClick, onUploadFileClick, onClose }) => {
  const { rooms, currentRoomId, setCurrentRoom, createRoom, deleteRoom } = useDataroomStore();
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingDeleteRoom, setPendingDeleteRoom] = useState<PendingDeleteRoom | null>(null);

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      await createRoom(newRoomName);
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to create room from Sidebar', roomName: newRoomName });
    }
    setNewRoomName('');
    setIsCreatingRoom(false);
  };

  const handleDeleteRoomClick = (roomId: string, roomName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteRoom({ id: roomId, name: roomName });
  };

  const handleDeleteRoomConfirm = async () => {
    if (!pendingDeleteRoom) return;
    try {
      await deleteRoom(pendingDeleteRoom.id);
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to delete room from Sidebar', roomId: pendingDeleteRoom.id, roomName: pendingDeleteRoom.name });
    } finally {
      setPendingDeleteRoom(null);
    }
  };

  const handleRoomSelect = async (roomId: string) => {
    try {
      await setCurrentRoom(roomId);
      if (onClose) {
        onClose();
      }
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to switch rooms from Sidebar', roomId });
    }
  };

  return (
    <>
      <aside className="w-64 border-r border-border bg-card flex flex-col h-full text-foreground select-none">
      <div className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <FolderKanban className="h-6 w-6" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-primary">Acme Data Room</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="p-4 relative shrink-0">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-medium py-3 px-4 rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>New</span>
        </button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute left-4 right-4 mt-2 bg-popover text-popover-foreground border border-border rounded-xl shadow-lg py-2 z-20 animate-in fade-in slide-in-from-top-1 duration-100">
              <button
                onClick={() => {
                  setIsCreatingRoom(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-left transition-colors cursor-pointer"
              >
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span>New Data Room</span>
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => {
                  onNewFolderClick();
                  setIsDropdownOpen(false);
                  if (onClose) onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-left transition-colors cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 text-muted-foreground" />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => {
                  onUploadFileClick();
                  setIsDropdownOpen(false);
                  if (onClose) onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent text-left transition-colors cursor-pointer"
              >
                <FileUp className="h-4 w-4 text-muted-foreground" />
                <span>Upload PDF File</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Data Rooms
        </div>

        {isCreatingRoom && (
          <form onSubmit={handleCreateRoomSubmit} className="mb-2 px-2 animate-in fade-in duration-200">
            <input
              type="text"
              autoFocus
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name..."
              className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsCreatingRoom(false)}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/95 transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1">
          {rooms.map((room) => {
            const isActive = room.id === currentRoomId;
            return (
              <div
                key={room.id}
                onClick={() => handleRoomSelect(room.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderKanban className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <span className="truncate">{room.name}</span>
                </div>
                {/* Prevent deleting the last room if desired, but we have a fallback room creation anyway */}
                <button
                  onClick={(e) => handleDeleteRoomClick(room.id, room.name, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded transition-all shrink-0 cursor-pointer"
                  title="Delete Room"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>

    <ConfirmModal
      isOpen={pendingDeleteRoom !== null}
      onClose={() => setPendingDeleteRoom(null)}
      onConfirm={handleDeleteRoomConfirm}
      title="Delete Data Room"
      description={`Are you sure you want to delete room "${pendingDeleteRoom?.name}"? This will permanently delete all its files and folders and cannot be undone.`}
      confirmLabel="Delete Room"
      isDestructive
    />
  </>
  );
};
