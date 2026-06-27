import type { StateCreator } from 'zustand';
import type { DataroomStore } from './useDataroomStore';
import { NodeType, type DataNode } from '@/types/dataroom';
import { dbService } from '@/services/db';
import { generateUUID } from '@/utils/uuid';
import { sentryService } from '@/services/sentry';
import { isDescendant, updateUrlParams } from '@/utils/nodeHelpers';

export interface NodesSlice {
  nodes: DataNode[];
  currentFolderId: string | null;
  setCurrentFolder: (folderId: string | null) => void;
  createFolder: (name: string) => Promise<void>;
  uploadFile: (name: string, fileData: Blob, mimeType: string, size: number) => Promise<void>;
  updateNodeName: (nodeId: string, newName: string) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  moveNode: (nodeId: string, targetParentId: string | null) => Promise<void>;
  uploadMultipleFiles: (files: FileList) => Promise<void>;
}

const resolveUniqueName = (
  nodes: DataNode[],
  baseName: string,
  parentId: string | null,
  type: NodeType
): string => {
  const siblings = nodes.filter(n => n.parentId === parentId && n.type === type);
  const siblingNames = new Set(siblings.map(s => s.name.toLowerCase()));

  if (!siblingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let nameWithoutExt = baseName;
  let ext = '';
  if (type === NodeType.FILE) {
    const lastDotIdx = baseName.lastIndexOf('.');
    if (lastDotIdx !== -1) {
      nameWithoutExt = baseName.substring(0, lastDotIdx);
      ext = baseName.substring(lastDotIdx);
    }
  }

  let counter = 1;
  let newName = '';
  do {
    newName = `${nameWithoutExt} (${counter})${ext}`;
    counter++;
  } while (siblingNames.has(newName.toLowerCase()));

  return newName;
};



export const createNodesSlice: StateCreator<
  DataroomStore,
  [],
  [],
  NodesSlice
> = (set, get) => ({
  nodes: [],
  currentFolderId: null,

  setCurrentFolder: (folderId) => {
    set({ currentFolderId: folderId });
    updateUrlParams(get().currentRoomId, folderId);
  },

  createFolder: async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const { currentRoomId, currentFolderId, nodes } = get();
    if (!currentRoomId) return;

    set({ loading: true, error: null });
    try {
      const uniqueName = resolveUniqueName(nodes, trimmedName, currentFolderId, NodeType.FOLDER);
      const now = Date.now();

      const newFolder: DataNode = {
        id: generateUUID(),
        roomId: currentRoomId,
        parentId: currentFolderId,
        type: NodeType.FOLDER,
        name: uniqueName,
        createdAt: now,
        updatedAt: now,
      };

      await dbService.saveNode(newFolder);
      const updatedNodes = await dbService.getNodesByRoom(currentRoomId);

      set({
        nodes: updatedNodes,
        loading: false,
      });
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to create folder', folderName: trimmedName, parentId: currentFolderId });
      set({ error: 'Failed to create folder', loading: false });
    }
  },

  uploadFile: async (name, fileData, mimeType, size) => {
    const { currentRoomId, currentFolderId, nodes } = get();
    if (!currentRoomId) return;

    const sanitizedName = name.trim() || 'unnamed_file';

    set({ loading: true, error: null });
    try {
      const uniqueName = resolveUniqueName(nodes, sanitizedName, currentFolderId, NodeType.FILE);
      const now = Date.now();

      const newFile: DataNode = {
        id: generateUUID(),
        roomId: currentRoomId,
        parentId: currentFolderId,
        type: NodeType.FILE,
        name: uniqueName,
        createdAt: now,
        updatedAt: now,
        size,
        mimeType,
        fileData,
      };

      await dbService.saveNode(newFile);
      const updatedNodes = await dbService.getNodesByRoom(currentRoomId);

      set({
        nodes: updatedNodes,
        loading: false,
      });
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to upload file', fileName: sanitizedName, size, mimeType });
      set({ error: 'Failed to upload file', loading: false });
    }
  },

  updateNodeName: async (nodeId, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const { currentRoomId, nodes } = get();
    if (!currentRoomId) return;

    set({ loading: true, error: null });
    try {
      const nodeToUpdate = nodes.find(n => n.id === nodeId);
      if (!nodeToUpdate) {
        throw new Error('Node not found');
      }

      const otherNodes = nodes.filter(n => n.id !== nodeId);
      const uniqueName = resolveUniqueName(otherNodes, trimmedName, nodeToUpdate.parentId, nodeToUpdate.type);

      const updatedNode: DataNode = {
        ...nodeToUpdate,
        name: uniqueName,
        updatedAt: Date.now(),
      };

      await dbService.saveNode(updatedNode);
      const updatedNodes = await dbService.getNodesByRoom(currentRoomId);

      set({
        nodes: updatedNodes,
        loading: false,
      });
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to rename item', nodeId, newName: trimmedName });
      set({ error: 'Failed to rename item', loading: false });
    }
  },

  deleteNode: async (nodeId) => {
    const { currentRoomId, currentFolderId } = get();
    if (!currentRoomId) return;

    set({ loading: true, error: null });
    try {
      await dbService.deleteNode(nodeId);
      const updatedNodes = await dbService.getNodesByRoom(currentRoomId);

      let nextFolderId = currentFolderId;
      if (currentFolderId === nodeId || !updatedNodes.some(n => n.id === currentFolderId && n.type === NodeType.FOLDER)) {
        const deletedFolder = get().nodes.find(n => n.id === nodeId);
        nextFolderId = deletedFolder?.parentId || null;
      }

      set({
        nodes: updatedNodes,
        currentFolderId: nextFolderId,
        loading: false,
      });
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to delete item', nodeId });
      set({ error: 'Failed to delete item', loading: false });
    }
  },

  moveNode: async (nodeId, targetParentId) => {
    const { currentRoomId, nodes } = get();
    if (!currentRoomId) return;

    if (nodeId === targetParentId) {
      throw new Error('Cannot move an item inside itself.');
    }

    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode) {
      throw new Error('Source item not found.');
    }

    if (sourceNode.type === NodeType.FOLDER && isDescendant(nodes, nodeId, targetParentId)) {
      throw new Error('Cannot move a folder inside its own subfolders.');
    }

    set({ loading: true, error: null });
    try {
      const targetName = resolveUniqueName(nodes, sourceNode.name, targetParentId, sourceNode.type);

      const updatedNode: DataNode = {
        ...sourceNode,
        parentId: targetParentId,
        name: targetName,
        updatedAt: Date.now(),
      };

      await dbService.saveNode(updatedNode);
      const updatedNodes = await dbService.getNodesByRoom(currentRoomId);

      set({
        nodes: updatedNodes,
        loading: false,
      });
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to move node', nodeId, targetParentId });
      set({ error: 'Failed to move item', loading: false });
      throw error;
    }
  },

  uploadMultipleFiles: async (files) => {
    const { uploadFile } = get();
    let hasNonPdf = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        hasNonPdf = true;
        continue;
      }
      try {
        await uploadFile(file.name, file, file.type, file.size);
      } catch (error) {
        sentryService.captureException(error, { message: 'Failed to upload dropped file', fileName: file.name });
      }
    }

    if (hasNonPdf) {
      set({ error: 'Only PDF files are supported for upload.' });
      setTimeout(() => {
        if (get().error === 'Only PDF files are supported for upload.') {
          set({ error: null });
        }
      }, 5000);
    }
  },
});
