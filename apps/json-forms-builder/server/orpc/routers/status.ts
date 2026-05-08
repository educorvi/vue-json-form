import { pub } from '../init';
import { StatusResponseSchema } from '~~/server/models/status';

export const statusRouter = {
    get: pub
        .route({
            method: 'GET',
            path: '/status',
            tags: ['Status'],
            summary: 'Health check',
            // No security — explicitly public
            // security: [],
        })
        .output(StatusResponseSchema)
        .handler(() =>
            StatusResponseSchema.parse({
                status: 'ok',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
            })
        ),
};
