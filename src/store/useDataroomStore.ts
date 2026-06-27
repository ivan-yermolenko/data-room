import { create } from 'zustand';
import { dbService } from '@/services/db';
import { createRoomsSlice, type RoomsSlice, createDefaultRoom } from './roomsSlice';
import { createNodesSlice, type NodesSlice } from './nodesSlice';
import { sentryService } from '@/services/sentry';
import { getUrlParams, updateUrlParams } from '@/utils/nodeHelpers';
import { NodeType } from '@/types/dataroom';

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

      // Read initial URL parameters
      const urlParams = getUrlParams();
      let activeRoomId = dbRooms[0].id;
      let activeFolderId: string | null = null;

      if (urlParams.roomId && dbRooms.some(r => r.id === urlParams.roomId)) {
        activeRoomId = urlParams.roomId;
      }

      const roomNodes = await dbService.getNodesByRoom(activeRoomId);

      // Verify if URL folderId exists inside this room
      if (urlParams.folderId && roomNodes.some(n => n.id === urlParams.folderId && n.type === NodeType.FOLDER)) {
        activeFolderId = urlParams.folderId;
      }

      set({
        rooms: dbRooms,
        currentRoomId: activeRoomId,
        currentFolderId: activeFolderId,
        nodes: roomNodes,
        loading: false,
      });

      updateUrlParams(activeRoomId, activeFolderId);

      // Listen to popstate event for browser back/forward navigation support
      if (typeof window !== 'undefined' && !(window as any).__dataroom_popstate_bound__) {
        (window as any).__dataroom_popstate_bound__ = true;
        window.addEventListener('popstate', async () => {
          const freshParams = getUrlParams();
          const { rooms, currentRoomId, currentFolderId } = get();

          let targetRoomId = currentRoomId;
          if (freshParams.roomId && rooms.some(r => r.id === freshParams.roomId)) {
            targetRoomId = freshParams.roomId;
          } else if (rooms.length > 0) {
            targetRoomId = rooms[0].id;
          }

          if (targetRoomId !== currentRoomId) {
            set({ loading: true });
            try {
              const roomNodes = await dbService.getNodesByRoom(targetRoomId!);
              let targetFolderId: string | null = null;
              if (freshParams.folderId && roomNodes.some(n => n.id === freshParams.folderId && n.type === NodeType.FOLDER)) {
                targetFolderId = freshParams.folderId;
              }
              set({
                currentRoomId: targetRoomId,
                currentFolderId: targetFolderId,
                nodes: roomNodes,
                loading: false,
              });
            } catch (error) {
              sentryService.captureException(error, { message: 'Failed to sync route on popstate' });
              set({ loading: false });
            }
          } else {
            // Same room, folder navigation change
            let targetFolderId: string | null = null;
            if (freshParams.folderId && get().nodes.some(n => n.id === freshParams.folderId && n.type === NodeType.FOLDER)) {
              targetFolderId = freshParams.folderId;
            }
            if (targetFolderId !== currentFolderId) {
              set({ currentFolderId: targetFolderId });
            }
          }
        });
      }
    } catch (error) {
      sentryService.captureException(error, { message: 'Failed to initialize Dataroom store' });
      set({ error: 'Failed to initialize storage', loading: false });
    }
  },
}));
