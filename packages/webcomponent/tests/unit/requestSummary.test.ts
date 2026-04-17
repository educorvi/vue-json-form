// @vitest-environment node
import {
    describe,
    it,
    expect,
    vi,
    beforeAll,
    afterAll,
    beforeEach,
} from 'vitest';
import { requestSummary } from '../../src/vueComponentCommons';
import { AiMockServer } from '../mock-server/ai-mock-server';

// Single shared server for all tests in this file
let server: AiMockServer;
let baseUrl: string;

beforeAll(async () => {
    server = new AiMockServer();
    baseUrl = await server.start();
});

afterAll(() => server.stop());

describe('requestSummary – SSE logging', () => {
    let consoleLogs: string[];
    let consoleErrors: string[];

    beforeEach(() => {
        consoleLogs = [];
        consoleErrors = [];
        vi.spyOn(console, 'log').mockImplementation((...args) => {
            consoleLogs.push(args.join(' '));
        });
        vi.spyOn(console, 'error').mockImplementation((...args) => {
            consoleErrors.push(args.join(' '));
        });
        server.resetCounters();
    });

    it('logs a progress line for every progress event', async () => {
        await requestSummary(
            `${baseUrl}/ai/summary`,
            new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
            'claim-summary'
        );

        const progressLogs = consoleLogs.filter((l) =>
            l.includes('[vue-json-form] SSE progress:')
        );
        // default sequence has 14 progress events
        expect(progressLogs.length).toBeGreaterThan(0);
    });

    it('logs the result event', async () => {
        await requestSummary(
            `${baseUrl}/ai/summary`,
            new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
            'claim-summary'
        );

        expect(consoleLogs).toContain(
            '[vue-json-form] SSE result: summary received'
        );
    });

    it('logs stage and status in progress lines', async () => {
        await requestSummary(
            `${baseUrl}/ai/summary`,
            new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
            'claim-summary'
        );

        const progressLogs = consoleLogs.filter((l) =>
            l.includes('[vue-json-form] SSE progress:')
        );
        expect(
            progressLogs.some((l) => l.includes('PREPROCESSING PROCESSING'))
        ).toBe(true);
        expect(progressLogs.some((l) => l.includes('GENERATING DONE'))).toBe(
            true
        );
    });

    it('includes page counts in progress lines for paged stages', async () => {
        await requestSummary(
            `${baseUrl}/ai/summary`,
            new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
            'claim-summary'
        );

        const progressLogs = consoleLogs.filter((l) =>
            l.includes('[vue-json-form] SSE progress:')
        );
        expect(progressLogs.some((l) => l.includes('(1/3)'))).toBe(true);
    });

    it('includes the optional message field when present', async () => {
        await requestSummary(
            `${baseUrl}/ai/summary`,
            new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
            'claim-summary'
        );

        expect(consoleLogs.some((l) => l.includes('3 pages found'))).toBe(true);
    });

    it('returns the summary text from the result event', async () => {
        const result = await requestSummary(
            `${baseUrl}/ai/summary`,
            new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
            'claim-summary'
        );

        expect(result.summary).toContain('Mock Summary');
    });

    it('logs an SSE error event to console.error and throws', async () => {
        const errServer = new AiMockServer({
            summaryEvents: [
                {
                    event: 'error',
                    data: { message: 'PDF too large', details: 'max 10MB' },
                },
            ],
        });
        const url = await errServer.start();

        await expect(
            requestSummary(
                `${url}/ai/summary`,
                new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
                'claim-summary'
            )
        ).rejects.toThrow('PDF too large');

        await errServer.stop();

        expect(
            consoleErrors.some((l) =>
                l.includes('[vue-json-form] SSE error: PDF too large')
            )
        ).toBe(true);
        expect(consoleErrors.some((l) => l.includes('max 10MB'))).toBe(true);
    });

    it('throws when the server returns an HTTP error', async () => {
        const errServer = new AiMockServer({
            summaryHttpError: { status: 500, message: 'Internal server error' },
        });
        const url = await errServer.start();

        await expect(
            requestSummary(
                `${url}/ai/summary`,
                new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
                'claim-summary'
            )
        ).rejects.toThrow('Internal server error');

        await errServer.stop();
    });

    it('throws when no result event is received', async () => {
        const noResultServer = new AiMockServer({
            summaryEvents: [
                {
                    event: 'progress',
                    data: { stage: 'PREPROCESSING', status: 'PROCESSING' },
                },
            ],
        });
        const url = await noResultServer.start();

        await expect(
            requestSummary(
                `${url}/ai/summary`,
                new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
                'claim-summary'
            )
        ).rejects.toThrow('No result event received');

        await noResultServer.stop();
    });
});
