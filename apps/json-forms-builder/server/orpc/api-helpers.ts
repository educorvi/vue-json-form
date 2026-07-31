import type { FindOptionsOrderValue } from 'typeorm';
import { zPaginatedMeta } from './generated/zod.gen';
import z from 'zod';

type PaginatedMeta = z.infer<typeof zPaginatedMeta>;

export interface PaginationParams {
    page: number;
    pageSize: number;
    sortOrder: FindOptionsOrderValue;
    search: string;
}

export function paginatedResponse<T>(
    data: T[],
    totalCount: number,
    page: number,
    pageSize: number
): PaginatedMeta & { data: T[] } {
    return {
        page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: Math.max(Math.ceil(totalCount / pageSize), 1),
        data: data,
    };
}
