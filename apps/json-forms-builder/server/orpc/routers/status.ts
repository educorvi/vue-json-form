import { os } from '../init';

export const statusRouter = {
    get: os.status.get.handler(() => ({
        status: 'ok' as const,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    })),
};
