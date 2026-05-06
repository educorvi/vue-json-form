import type { H3Event } from 'h3';
import { ErrorCode } from '~~/server/models/errors';

export interface PaginationParams {
    page: number;
    pageSize: number;
    sortOrder: 'ASC' | 'DESC';
    search: string;
}

export function parsePagination(event: H3Event): PaginationParams {
    const query = getQuery(event);
    return {
        page: Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1),
        pageSize: Math.min(
            100,
            Math.max(1, parseInt(String(query.page_size ?? '20'), 10) || 20)
        ),
        sortOrder: query.sort_order === 'asc' ? 'ASC' : 'DESC',
        search: String(query.search ?? '')
            .trim()
            .slice(0, 200),
    };
}

export function paginatedResponse<T>(
    data: T[],
    totalCount: number,
    page: number,
    pageSize: number
) {
    return {
        page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / pageSize),
        data,
    };
}

export function throwNotFound(
    message = 'Not found',
    code: ErrorCode = ErrorCode.NOT_FOUND
): never {
    throw createError({ statusCode: 404, message, data: { code } });
}

export function throwBadRequest(
    message = 'Bad request',
    code: ErrorCode = ErrorCode.VALIDATION_ERROR
): never {
    throw createError({ statusCode: 400, message, data: { code } });
}

/** Alias for throwBadRequest — used when the problem is input validation */
export const throwValidationError = throwBadRequest;

export function throwConflict(
    message = 'Conflict',
    code: ErrorCode = ErrorCode.CONFLICT
): never {
    throw createError({ statusCode: 409, message, data: { code } });
}

export function throwUnprocessable(
    message = 'Unprocessable entity',
    code: ErrorCode = ErrorCode.UNPROCESSABLE
): never {
    throw createError({ statusCode: 422, message, data: { code } });
}

export function throwUnauthorized(
    message = 'Unauthorized',
    code: ErrorCode = ErrorCode.UNAUTHORIZED
): never {
    throw createError({ statusCode: 401, message, data: { code } });
}

/**
 * Wraps a handler body in a try/catch so all unhandled errors
 * are returned as a structured 500 response.
 */
export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (err: unknown) {
        // Re-throw H3 errors as-is (they already have statusCode)
        if (err && typeof err === 'object' && 'statusCode' in err) throw err;
        console.error('[API Error]', err);
        throw createError({
            statusCode: 500,
            message: 'Internal server error',
            data: { code: ErrorCode.INTERNAL_ERROR },
        });
    }
}
