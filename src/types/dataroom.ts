export interface Dataroom {
  id: string;
  name: string;
  createdAt: number;
}

export type NodeType = 'folder' | 'file';

export interface DataNode {
  id: string;
  roomId: string;
  parentId: string | null;
  type: NodeType;
  name: string;
  createdAt: number;
  updatedAt: number;
  size?: number;
  mimeType?: string;
  fileData?: Blob; // stored in IndexedDB for files
}
