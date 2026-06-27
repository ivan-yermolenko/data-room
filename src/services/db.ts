import type { Dataroom, DataNode } from '@/types/dataroom';
import { sentryService } from '@/services/sentry';

const DB_NAME = 'dataroom-db';
const DB_VERSION = 1;
const ROOMS_STORE = 'rooms';
const NODES_STORE = 'nodes';

class DataroomDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        sentryService.captureException(request.error, { message: 'Failed to open IndexedDB' });
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Create rooms store
        if (!db.objectStoreNames.contains(ROOMS_STORE)) {
          db.createObjectStore(ROOMS_STORE, { keyPath: 'id' });
        }

        // Create nodes store
        if (!db.objectStoreNames.contains(NODES_STORE)) {
          const nodesStore = db.createObjectStore(NODES_STORE, { keyPath: 'id' });
          // Index for quick roomId lookups (for getting all nodes in a room)
          nodesStore.createIndex('roomId', 'roomId', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  // --- Room Operations ---

  public async getRooms(): Promise<Dataroom[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ROOMS_STORE, 'readonly');
      const store = transaction.objectStore(ROOMS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveRoom(room: Dataroom): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ROOMS_STORE, 'readwrite');
      const store = transaction.objectStore(ROOMS_STORE);
      const request = store.put(room);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteRoom(roomId: string): Promise<void> {
    const db = await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([ROOMS_STORE, NODES_STORE], 'readwrite');
      const roomsStore = transaction.objectStore(ROOMS_STORE);
      const nodesStore = transaction.objectStore(NODES_STORE);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      // Delete the room
      roomsStore.delete(roomId);

      // Query all nodes in this room and delete them
      const index = nodesStore.index('roomId');
      const request = index.openCursor(IDBKeyRange.only(roomId));
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    });
  }

  // --- Node Operations ---

  public async getNodesByRoom(roomId: string): Promise<DataNode[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(NODES_STORE, 'readonly');
      const store = transaction.objectStore(NODES_STORE);
      const index = store.index('roomId');
      const request = index.getAll(IDBKeyRange.only(roomId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async getNodesByParent(roomId: string, parentId: string | null): Promise<DataNode[]> {
    // Fetch all nodes in the room and filter by parentId in memory.
    // This is simple, robust, handles parentId: null without issue, and is fast for MVP-sized rooms.
    const allRoomNodes = await this.getNodesByRoom(roomId);
    return allRoomNodes.filter(node => node.parentId === parentId);
  }

  public async saveNode(node: DataNode): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(NODES_STORE, 'readwrite');
      const store = transaction.objectStore(NODES_STORE);
      const request = store.put(node);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteNode(nodeId: string): Promise<void> {
    const db = await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(NODES_STORE, 'readwrite');
      const store = transaction.objectStore(NODES_STORE);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      // Read all nodes to find children recursively and delete them
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const allNodes = getAllRequest.result || [];
        const toDeleteIds = new Set<string>();

        const collectIds = (id: string) => {
          toDeleteIds.add(id);
          const children = allNodes.filter(n => n.parentId === id);
          children.forEach(c => collectIds(c.id));
        };

        collectIds(nodeId);

        // Delete all collected IDs
        toDeleteIds.forEach(id => {
          store.delete(id);
        });
      };
    });
  }
}

export const dbService = new DataroomDB();
