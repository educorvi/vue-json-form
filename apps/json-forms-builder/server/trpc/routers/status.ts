import { z } from 'zod/v4';
import { router, publicProcedure } from '../init';
import { StatusResponseSchema } from '~~/server/models/status';

export const statusRouter = router({
    get: publicProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/status',
                protect: false,
                tags: ['Status'],
                summary: 'Health check',
            },
        })
        .input(z.void())
        .output(StatusResponseSchema)
        .query(() => {
            return StatusResponseSchema.parse({
                status: 'ok',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
            });
        }),
});
