import { StatusResponseSchema } from '~~/server/models/status';

defineRouteMeta({
    openAPI: {
        tags: ['Status'],
        summary: 'Health check',
        description:
            'Returns service health status, API version, and current server timestamp. Does not require authentication.',
    },
});

export default defineEventHandler(() => {
    return StatusResponseSchema.parse({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
