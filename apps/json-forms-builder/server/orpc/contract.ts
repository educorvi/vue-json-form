/**
 * Application contract — groups the generated oRPC procedure contracts into
 * the same shape as the router so implement() can enforce them end-to-end.
 *
 * URL query parameters always arrive as strings, but the generated zod.gen.ts
 * uses z.int() which rejects strings. We override the listUsers input with
 * z.coerce so '1' → 1 before validation. This thin wrapper is the correct
 * place for transport-layer coercion — separate from business logic.
 */
import { oc } from '@orpc/contract';
import * as z from 'zod';
import { getStatus, listUsers } from './generated/orpc.gen';
import { zListUsersResponse } from './generated/zod.gen';

// const listUsers = oc
//     .route({
//         description: 'Returns a paginated, searchable and filterable list of users.',
//         inputStructure: 'detailed',
//         method: 'GET',
//         operationId: 'listUsers',
//         path: '/users',
//         summary: 'List users',
//         tags: ['Users'],
//     })
//     .input(
//         z.object({
//             query: z
//                 .object({
//                     page: z.coerce.number().int().min(1).default(1),
//                     page_size: z.coerce.number().int().min(1).max(100).default(20),
//                     search: z.string().max(200).optional(),
//                     sort_order: z.enum(['asc', 'desc']).default('desc'),
//                     order_by: z
//                         .enum(['id', 'firstname', 'lastname', 'email', 'created', 'last_activity', 'role'])
//                         .default('last_activity'),
//                 })
//                 .optional(),
//         })
//     )
//     .output(zListUsersResponse);

export const appContract = {
    status: { get: getStatus },
    users: { list: listUsers },
};
