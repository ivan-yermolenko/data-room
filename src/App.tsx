import { useEffect, useState } from 'react';
import { useDataroomStore } from '@/store/useDataroomStore';
import { WorkspaceLayout } from '@/components/features/layout/WorkspaceLayout';
import { NodeGrid } from '@/components/features/nodes/NodeGrid';
import { CreateFolderModal } from '@/components/features/nodes/modals/CreateFolderModal';
import { RenameModal } from '@/components/features/nodes/modals/RenameModal';
import { PdfPreviewModal } from '@/components/features/nodes/modals/PdfPreviewModal';
import { useDebounce } from '@/hooks/useDebounce';
import { sentryService } from '@/services/sentry';
import { NodeType, type DataNode } from '@/types/dataroom';
import { Loader2 } from 'lucide-react';

function App() {
  const {
    initStore,
    loading,
    error,
    currentRoomId,
    currentFolderId,
    nodes,
    createFolder,
    uploadFile,
    updateNodeName,
    deleteNode,
    setCurrentFolder
  } = useDataroomStore();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeModal, setActiveModal] = useState<'create-folder' | 'rename' | 'preview' | null>(null);
  const [activeNode, setActiveNode] = useState<DataNode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    initStore().catch((error) => {
      sentryService.captureException(error, { message: 'Failed to initialize Dataroom store from App effect' });
    });
  }, [initStore]);

  // Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleNewFolderTrigger = () => {
    setActiveModal('create-folder');
  };

  const handleCreateFolderSubmit = async (name: string) => {
    await createFolder(name);
  };

  const handleRenameClick = (node: DataNode) => {
    setActiveNode(node);
    setActiveModal('rename');
  };

  const handleRenameSubmit = async (newName: string) => {
    if (activeNode) {
      await updateNodeName(activeNode.id, newName);
    }
  };

  const handleDeleteClick = async (node: DataNode) => {
    const message = node.type === NodeType.FOLDER
      ? `Are you sure you want to delete folder "${node.name}" and all its contents recursively?`
      : `Are you sure you want to delete file "${node.name}"?`;
    if (confirm(message)) {
      try {
        await deleteNode(node.id);
      } catch (error) {
        sentryService.captureException(error, { message: 'Failed to delete node', nodeId: node.id });
      }
    }
  };

  const handleNodeOpen = (node: DataNode) => {
    if (node.type === NodeType.FOLDER) {
      setCurrentFolder(node.id);
    } else {
      if (node.fileData) {
        try {
          const url = URL.createObjectURL(node.fileData);
          setPreviewUrl(url);
          setActiveNode(node);
          setActiveModal('preview');
        } catch (error) {
          sentryService.captureException(error, { message: 'Failed to create object URL for file preview', nodeId: node.id });
        }
      } else {
        alert('File data is not loaded or missing.');
      }
    }
  };

  const handleCloseModal = () => {
    if (activeModal === 'preview' && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setActiveModal(null);
    setActiveNode(null);
    setPreviewUrl(null);
  };

  const handleUploadFileTrigger = () => {
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
      <div className="h-full flex flex-col p-1 select-none">
        {error && (
          <div className="mb-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-4 py-2 text-sm shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1">
          <NodeGrid
            nodes={nodes}
            currentFolderId={currentFolderId}
            searchQuery={debouncedSearchQuery}
            onNodeOpen={handleNodeOpen}
            onRenameClick={handleRenameClick}
            onDeleteClick={handleDeleteClick}
          />
        </div>
      </div>

      <CreateFolderModal
        key={activeModal === 'create-folder' ? 'create-folder-open' : 'create-folder-closed'}
        isOpen={activeModal === 'create-folder'}
        onClose={handleCloseModal}
        onSubmit={handleCreateFolderSubmit}
      />

      <RenameModal
        key={activeNode ? `rename-${activeNode.id}` : 'rename-closed'}
        isOpen={activeModal === 'rename'}
        onClose={handleCloseModal}
        node={activeNode}
        onSubmit={handleRenameSubmit}
      />

      <PdfPreviewModal
        isOpen={activeModal === 'preview'}
        onClose={handleCloseModal}
        node={activeNode}
        previewUrl={previewUrl}
      />
    </WorkspaceLayout>
  );
}

export default App;
