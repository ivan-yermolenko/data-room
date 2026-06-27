import { useEffect, useState } from 'react';
import { useDataroomStore } from '@/store/useDataroomStore';
import { WorkspaceLayout } from '@/components/features/WorkspaceLayout';
import { useDebounce } from '@/hooks/useDebounce';
import { sentryService } from '@/services/sentry';
import { Loader2 } from 'lucide-react';

function App() {
  const { initStore, loading, error, currentRoomId, currentFolderId, nodes, createFolder, uploadFile } = useDataroomStore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    initStore().catch((error) => {
      sentryService.captureException(error, { message: 'Failed to initialize Dataroom store from App effect' });
    });
  }, [initStore]);

  const handleNewFolderTrigger = async () => {
    // Temporary modal alert until Step 5
    const folderName = prompt('Enter new folder name:');
    if (folderName) {
      try {
        await createFolder(folderName);
      } catch (error) {
        sentryService.captureException(error, { message: 'Failed to create folder from App trigger', folderName });
      }
    }
  };

  const handleUploadFileTrigger = () => {
    // Temporary file upload action until Step 5 (will invoke standard file selector)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          await uploadFile(
            file.name,
            file,
            file.type,
            file.size
          );
        } catch (error) {
          sentryService.captureException(error, { message: 'Failed to upload file from App trigger', fileName: file.name });
        }
      }
    };
    fileInput.click();
  };

  if (loading && !currentRoomId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Initializing Data Room...</span>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onNewFolderClick={handleNewFolderTrigger}
      onUploadFileClick={handleUploadFileTrigger}
    >
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground select-none">
        {error && (
          <div className="mb-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-4 py-2 text-sm">
            {error}
          </div>
        )}
        <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-sm max-w-md">
          <p className="font-semibold text-foreground mb-1">Layout Shell is ready!</p>
          <p className="text-sm">
            Workspace frame, Header, Sidebar, and Breadcrumbs are connected to Zustand and IndexedDB.
          </p>
          <p className="text-xs mt-4 text-muted-foreground/80">
            Room ID: <code className="bg-background px-1.5 py-0.5 rounded border border-border text-[10px]">{currentRoomId}</code>
            <br />
            Folder ID: <code className="bg-background px-1.5 py-0.5 rounded border border-border text-[10px]">{currentFolderId ?? 'root'}</code>
            <br />
            Total Nodes Loaded: <code className="bg-background px-1.5 py-0.5 rounded border border-border text-[10px]">{nodes.length}</code>
            {debouncedSearchQuery && (
              <>
                <br />
                Search: <code className="bg-background px-1.5 py-0.5 rounded border border-border text-[10px]">{debouncedSearchQuery}</code>
              </>
            )}
          </p>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

export default App;
