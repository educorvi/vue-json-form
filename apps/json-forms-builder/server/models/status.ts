import { z, globalRegistry } from 'zod/v4';

export const StatusResponseSchema = z
    .object({
        status: z
            .enum(['ok', 'degraded', 'error'])
            .describe('Service health state'),
        version: z.string().describe('API version'),
        timestamp: z.string().datetime().describe('Current server time'),
    })
    .register(globalRegistry, { id: 'StatusResponse' });

export type StatusResponse = z.infer<typeof StatusResponseSchema>;
