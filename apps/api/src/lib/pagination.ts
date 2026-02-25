import { PAGE_SIZE, MAX_PAGE_SIZE } from '@egx/shared';

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function parsePaginationQuery(query: {
  cursor?: string;
  limit?: string;
}): CursorPaginationOptions {
  return {
    cursor: query.cursor || undefined,
    limit: Math.min(
      Math.max(Number(query.limit) || PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    ),
  };
}

export interface CursorQueryResult {
  take: number;
  skip?: number;
  cursor?: { id: string };
}

/**
 * Builds Prisma cursor-based pagination args.
 * Convention: cursor is the `id` of the last item seen.
 */
export function buildCursorQuery(options: CursorPaginationOptions): CursorQueryResult {
  const take = (options.limit || PAGE_SIZE) + 1; // Fetch one extra to detect hasMore

  if (options.cursor) {
    return {
      take,
      skip: 1, // Skip the cursor item itself
      cursor: { id: options.cursor },
    };
  }

  return { take };
}

/**
 * Processes query results into a paginated response.
 * Pass the raw results from Prisma (which fetched limit+1 items).
 */
export function processPaginatedResults<T extends { id: string }>(
  results: T[],
  limit: number = PAGE_SIZE,
): PaginatedResult<T> {
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null;

  return { data, nextCursor, hasMore };
}
