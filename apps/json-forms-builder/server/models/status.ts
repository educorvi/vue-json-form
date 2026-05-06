import { z } from 'zod';
import { toOpenApi } from '../utils/openapi';
import type { SchemaObject } from './types';

// ── Zod schema (source of truth) ───────────────────────────────────────────

export const StatusResponseSchema = z.object({
    status: z
        .enum(['ok', 'degraded', 'error'])
        .describe('Service health state'),
    version: z.string().describe('API version'),
    timestamp: z.string().datetime().describe('Current server time'),
});

// ── Derived TypeScript type ────────────────────────────────────────────────

export type StatusResponse = z.infer<typeof StatusResponseSchema>;

// ── OpenAPI schema (derived) ───────────────────────────────────────────────

export const StatusResponseOpenApiSchema: SchemaObject =
    toOpenApi(StatusResponseSchema);
