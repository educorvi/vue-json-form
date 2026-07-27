import { ORPCError } from '@orpc/server';
import { ErrorCode } from '~~/server/models/errors';

export interface PaginationParams {
    page: number;
    pageSize: number;
    sortOrder: 'ASC' | 'DESC';
    search: string;
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
        total_pages: Math.max(Math.ceil(totalCount / pageSize), 1),
        data,
    };
}

export function throwNotFound(
    message = 'Not found',
    code: ErrorCode = ErrorCode.NOT_FOUND
): never {
    throw new ORPCError('NOT_FOUND', { message, data: { code } });
}

export function throwConflict(
    message = 'Conflict',
    code: ErrorCode = ErrorCode.CONFLICT
): never {
    throw new ORPCError('CONFLICT', { message, data: { code } });
}

// export function throwUnprocessable(
//     message = 'Unprocessable entity',
//     code: ErrorCode = ErrorCode.UNPROCESSABLE
// ): never {
//     throw createError({ statusCode: 422, message, data: { code } });
// }

// export function throwUnauthorized(
//     message = 'Unauthorized',
//     code: ErrorCode = ErrorCode.UNAUTHORIZED
// ): never {
//     throw createError({ statusCode: 401, message, data: { code } });
// }

// export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
//     try {
//         return await fn();
//     } catch (err: unknown) {
//         if (err && typeof err === 'object' && 'statusCode' in err) throw err;
//         console.error('[API Error]', err);
//         throw createError({
//             statusCode: 500,
//             message: 'Internal server error',
//             data: { code: ErrorCode.INTERNAL_ERROR },
//         });
//     }
// }
