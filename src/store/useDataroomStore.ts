import { create } from 'zustand';
import { dbService } from '@/services/db';
import { createRoomsSlice, type RoomsSlice, createDefaultRoom } from './roomsSlice';
import { createNodesSlice, type NodesSlice } from './nodesSlice';

export type DataroomStore = RoomsSlice & NodesSlice & {
  loading: boolean;
  error: string | null;
  initStore: () => Promise<void>;
};

export const useDataroomStore = create<DataroomStore>()((set, get, ...args) => ({
  loading: false,
  error: null,

  ...createRoomsSlice(set, get, ...args),
  ...createNodesSlice(set, get, ...args),

  initStore: async () => {
    set({ loading: true, error: null });
    try {
      await dbService.init();
      let dbRooms = await dbService.getRooms();

      if (dbRooms.length === 0) {
        const defaultRoom = createDefaultRoom();
        await dbService.saveRoom(defaultRoom);
        dbRooms = [defaultRoom];
      }

      const activeRoomId = dbRooms[0].id;
      const roomNodes = await dbService.getNodesByRoom(activeRoomId);

      set({
        rooms: dbRooms,
        currentRoomId: activeRoomId,
        currentFolderId: null,
        nodes: roomNodes,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to initialize Dataroom store:', err);
      set({ error: 'Failed to initialize storage', loading: false });
    }
  },
}));
