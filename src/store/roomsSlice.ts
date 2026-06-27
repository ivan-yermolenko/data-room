import type { StateCreator } from 'zustand';
import type { DataroomStore } from './useDataroomStore';
import type { Dataroom } from '@/types/dataroom';
import { dbService } from '@/services/db';
import { generateUUID } from '@/utils/uuid';

export interface RoomsSlice {
  rooms: Dataroom[];
  currentRoomId: string | null;
  createRoom: (name: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (roomId: string) => Promise<void>;
}

export const createDefaultRoom = (): Dataroom => ({
  id: generateUUID(),
  name: 'room',
  createdAt: Date.now(),
});

export const createRoomsSlice: StateCreator<
  DataroomStore,
  [],
  [],
  RoomsSlice
> = (set, get) => ({
  rooms: [],
  currentRoomId: null,

  setCurrentRoom: async (roomId) => {
    set({ loading: true, error: null });
    try {
      const roomNodes = await dbService.getNodesByRoom(roomId);
      set({
        currentRoomId: roomId,
        currentFolderId: null, // Reset navigation to root
        nodes: roomNodes,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to switch rooms:', err);
      set({ error: 'Failed to load room data', loading: false });
    }
  },

  createRoom: async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    set({ loading: true, error: null });
    try {
      const newRoom: Dataroom = {
        id: generateUUID(),
        name: trimmedName,
        createdAt: Date.now(),
      };
      await dbService.saveRoom(newRoom);
      const dbRooms = await dbService.getRooms();

      set({
        rooms: dbRooms,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to create room:', err);
      set({ error: 'Failed to create room', loading: false });
    }
  },

  deleteRoom: async (roomId) => {
    set({ loading: true, error: null });
    try {
      await dbService.deleteRoom(roomId);
      let dbRooms = await dbService.getRooms();

      let nextRoomId = get().currentRoomId;
      let nextNodes = get().nodes;
      let nextFolderId = get().currentFolderId;

      if (roomId === get().currentRoomId) {
        nextFolderId = null;
        if (dbRooms.length > 0) {
          nextRoomId = dbRooms[0].id;
          nextNodes = await dbService.getNodesByRoom(nextRoomId);
        } else {
          const defaultRoom = createDefaultRoom();
          await dbService.saveRoom(defaultRoom);
          dbRooms = [defaultRoom];
          nextRoomId = defaultRoom.id;
          nextNodes = [];
        }
      }

      set({
        rooms: dbRooms,
        currentRoomId: nextRoomId,
        currentFolderId: nextFolderId,
        nodes: nextNodes,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to delete room:', err);
      set({ error: 'Failed to delete room', loading: false });
    }
  },
});
