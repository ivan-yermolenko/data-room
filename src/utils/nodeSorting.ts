import { type DataNode, type SortByType } from '@/types/dataroom';

// Static dictionary mapping sort methods to typed comparator functions
const COMPARATORS: Record<SortByType, (a: DataNode, b: DataNode) => number> = {
  'name-asc': (a, b) => a.name.localeCompare(b.name),
  'name-desc': (a, b) => b.name.localeCompare(a.name),
  'date-newest': (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
  'date-oldest': (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
  'size-largest': (a, b) => (b.size || 0) - (a.size || 0),
  'size-smallest': (a, b) => (a.size || 0) - (b.size || 0),
};

/**
 * Pure function to sort dataroom nodes based on a specified criteria.
 * 
 * @param nodes List of data nodes to sort
 * @param sortBy Sorting criteria type
 * @returns Sorted copy of nodes array
 */
export const sortNodes = (nodes: DataNode[], sortBy: SortByType): DataNode[] => {
  const nodesCopy = [...nodes];
  const comparator = COMPARATORS[sortBy];
  return comparator ? nodesCopy.sort(comparator) : nodesCopy;
};
