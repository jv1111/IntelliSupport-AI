export const DEFAULT_PAGE_SIZE = 15;

export interface PaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function createPaginationMetadata(
  page: number,
  limit: number,
  totalCount: number,
): PaginationMetadata {
  const totalPages = Math.ceil(totalCount / limit);

  return {
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
