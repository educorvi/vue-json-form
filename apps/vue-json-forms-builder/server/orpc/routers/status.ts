import { os } from '../init';

export const statusRouter = {
    get: os.status.get.handler(() => ({
        status: 'ok' as const,
        version: '1.0.0', // TODO: use dynamic version form package.json and also add commit sha
        timestamp: new Date().toISOString(),
    })),
};
