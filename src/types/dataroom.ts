export interface Dataroom {
  id: string;
  name: string;
  createdAt: number;
}

export const NodeType = {
  FOLDER: 'folder',
  FILE: 'file',
} as const;

export type NodeType = typeof NodeType[keyof typeof NodeType];

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
