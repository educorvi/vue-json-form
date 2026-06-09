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
import {
    getStatus,
    listUsers,
    createUser,
    listGroups,
    getGroup,
    listGroupChildren,
    listGroupHierarchy,
    createGroup,
} from './generated/orpc.gen';

export const appContract = {
    status: { get: getStatus },
    users: { create: createUser, list: listUsers },
    groups: {
        list: listGroups,
        get: getGroup,
        listChildren: listGroupChildren,
        hierarchy: listGroupHierarchy,
        create: createGroup,
    },
};
