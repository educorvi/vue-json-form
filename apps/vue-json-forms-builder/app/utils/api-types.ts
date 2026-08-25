/**
 * Shared API types for the frontend.
 *
 * Derived from the generated oRPC zod schemas (`server/orpc/generated/zod.gen.ts`)
 * so the app never duplicates literal unions like `'visible' | 'private'` —
 * when the API schema changes, these types follow automatically.
 */
import { z } from 'zod';
import {
    zVisibility,
    zElementRole,
    zGlobalRole,
} from '~~/server/orpc/generated/zod.gen';

/** Visibility of a group or form (`'visible' | 'private'`). */
export type Visibility = z.infer<typeof zVisibility>;

/** Permission level on a specific form or group (`'owner' | 'editor' | 'guest'`). */
export type ElementRole = z.infer<typeof zElementRole>;

/** Global user role (`'admin' | 'user'`). */
export type GlobalRole = z.infer<typeof zGlobalRole>;
