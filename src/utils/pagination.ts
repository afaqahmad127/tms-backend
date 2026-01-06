export interface PaginationParams {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  edges: Array<{ node: T; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalPages: number;
    currentPage: number;
  };
  totalCount: number;
}

export const encodeCursor = (id: string): string => {
  return Buffer.from(id).toString('base64');
};

export const decodeCursor = (cursor: string): string => {
  return Buffer.from(cursor, 'base64').toString('utf8');
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const normalizeLimit = (limit?: number): number => {
  if (!limit) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
};

export const calculateOffset = (page: number, limit: number): number => {
  return (Math.max(1, page) - 1) * limit;
};

export const createPaginationResult = <T extends { _id: { toString: () => string } }>(
  items: T[],
  totalCount: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.max(1, page);

  const edges = items.map(item => ({
    node: item,
    cursor: encodeCursor(item._id.toString())
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      totalPages,
      currentPage
    },
    totalCount
  };
};

