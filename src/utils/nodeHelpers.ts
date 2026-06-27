import { type DataNode } from '@/types/dataroom';

/**
 * Checks if a child node is a descendant (subfolder/subitem) of a parent node.
 * Uses a visited Set to prevent infinite loops in cyclic graphs.
 * 
 * @param nodes Complete list of dataroom nodes
 * @param parentId Target parent node ID to check against
 * @param childId Current child node ID to trace upwards
 * @returns boolean true if childId is a descendant of parentId
 */
export const isDescendant = (nodes: DataNode[], parentId: string, childId: string | null): boolean => {
  let currentId = childId;
  const visited = new Set<string>();
  while (currentId && !visited.has(currentId)) {
    if (currentId === parentId) return true;
    visited.add(currentId);
    const parent = nodes.find(n => n.id === currentId);
    currentId = parent ? parent.parentId : null;
  }
  return false;
};

/**
 * Helper utility to prevent default browser behavior and stop event bubbling/propagation.
 * Useful for drag-and-drop actions and custom context menus.
 * 
 * @param event Any event object that has preventDefault and stopPropagation methods
 */
export const preventDefaults = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Updates URL search parameters reactively using History API.
 * Keeps history stack clean by checking for identical parameters.
 * 
 * @param roomId Active room ID or null
 * @param folderId Active folder ID or null
 */
export const updateUrlParams = (roomId: string | null, folderId: string | null) => {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  
  if (roomId) {
    params.set('room', roomId);
  } else {
    params.delete('room');
  }

  if (folderId) {
    params.set('folder', folderId);
  } else {
    params.delete('folder');
  }

  const newSearch = params.toString();
  const currentSearch = window.location.search.replace(/^\?/, '');

  if (newSearch !== currentSearch) {
    const newPath = newSearch ? `?${newSearch}` : window.location.pathname;
    window.history.pushState(null, '', newPath);
  }
};

/**
 * Reads room and folder parameters from current URL location.
 * 
 * @returns Object containing room and folder params
 */
export const getUrlParams = (): { roomId: string | null; folderId: string | null } => {
  if (typeof window === 'undefined') return { roomId: null, folderId: null };
  const params = new URLSearchParams(window.location.search);
  return {
    roomId: params.get('room'),
    folderId: params.get('folder'),
  };
};
