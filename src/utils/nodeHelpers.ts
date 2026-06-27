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
