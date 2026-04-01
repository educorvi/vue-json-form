/**
 * Mock HTTP server implementing the AI Assistant API (summary SSE endpoint only).
 * Covers:
 *   GET  /ai/prompt-types  → PromptTypeListResponse
 *   POST /ai/summary       → text/event-stream of SummaryProgressEvent / SummaryResultEvent / SummaryErrorEvent
 *
 * The synchronous /ai/summary-sync endpoint is intentionally not implemented.
 */

import {
    createServer,
    type IncomingMessage,
    type ServerResponse,
    type Server,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import { PromptType, SseEvent, SummaryStage } from '../../src/types';

// ── Schema types (mirroring the OpenAPI spec) ─────────────────────────────────

// ── Configuration ─────────────────────────────────────────────────────────────

export interface AiMockServerOptions {
    /** Prompt types returned by GET /ai/prompt-types. */
    promptTypes?: PromptType[];

    /**
     * Sequence of SSE events emitted for POST /ai/summary.
     * Defaults to a standard progress sequence followed by a result event.
     */
    summaryEvents?: SseEvent[];

    /**
     * When set, POST /ai/summary responds with this HTTP status and an
     * ErrorResponse body instead of streaming SSE events.
     */
    summaryHttpError?: {
        status: 400 | 500;
        message: string;
        stacktrace?: string;
    };

    /**
     * Milliseconds to wait between SSE events. Useful to simulate latency.
     * Defaults to 0.
     */
    eventIntervalMs?: number;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_PROMPT_TYPES: PromptType[] = [
    {
        name: 'claim-summary',
        description: 'Summarizes claim documents for quick triage.',
    },
    {
        name: 'contract-review',
        description: 'Reviews contract documents for key clauses.',
    },
];

const DEFAULT_SUMMARY_EVENTS: SseEvent[] = [
    {
        event: 'progress',
        data: { stage: SummaryStage.PREPROCESSING, status: 'PROCESSING' },
    },
    {
        event: 'progress',
        data: { stage: SummaryStage.PREPROCESSING, status: 'DONE' },
    },
    {
        event: 'progress',
        data: { stage: SummaryStage.PAGE_COUNTING, status: 'PROCESSING' },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.PAGE_COUNTING,
            status: 'DONE',
            message: '3 pages found',
        },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.IMAGE_CONVERSION,
            status: 'PROCESSING',
            current: 0,
            total: 3,
        },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.IMAGE_CONVERSION,
            status: 'PROCESSING',
            current: 1,
            total: 3,
        },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.IMAGE_CONVERSION,
            status: 'PROCESSING',
            current: 2,
            total: 3,
        },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.IMAGE_CONVERSION,
            status: 'DONE',
            current: 3,
            total: 3,
        },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.MARKDOWN_CONVERSION,
            status: 'PROCESSING',
            current: 0,
            total: 3,
        },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.MARKDOWN_CONVERSION,
            status: 'PROCESSING',
            current: 1,
            total: 3,
        },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.MARKDOWN_CONVERSION,
            status: 'PROCESSING',
            current: 2,
            total: 3,
        },
    },
    {
        event: 'progress',
        data: {
            stage: SummaryStage.MARKDOWN_CONVERSION,
            status: 'DONE',
            current: 3,
            total: 3,
        },
    },
    {
        event: 'progress',
        data: { stage: SummaryStage.GENERATING, status: 'PROCESSING' },
    },
    {
        event: 'progress',
        data: { stage: SummaryStage.GENERATING, status: 'DONE' },
    },
    {
        event: 'result',
        data: {
            summary: '## Mock Summary\n\nThis is a mock AI-generated summary.',
        },
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
    });
    res.end(payload);
}

function formatSseEvent(event: SseEvent): string {
    return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function consumeBody(req: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

// ── Mock server ───────────────────────────────────────────────────────────────

export class AiMockServer {
    private readonly server: Server;
    private readonly options: Required<AiMockServerOptions>;

    /** Number of requests received for POST /ai/summary since the last reset. */
    public summaryRequestCount = 0;

    /** Number of requests received for GET /ai/prompt-types since the last reset. */
    public promptTypesRequestCount = 0;

    constructor(options: AiMockServerOptions = {}) {
        this.options = {
            promptTypes: options.promptTypes ?? DEFAULT_PROMPT_TYPES,
            summaryEvents: options.summaryEvents ?? DEFAULT_SUMMARY_EVENTS,
            summaryHttpError: options.summaryHttpError ?? (undefined as any),
            eventIntervalMs: options.eventIntervalMs ?? 0,
        };

        this.server = createServer((req, res) => {
            void this.handleRequest(req, res);
        });
    }

    /** Start listening on an OS-assigned port and return the base URL. */
    start(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.server.listen(44803, '127.0.0.1', () => {
                const address = this.server.address() as AddressInfo;
                resolve(`http://127.0.0.1:${address.port}`);
            });
            this.server.once('error', reject);
        });
    }

    /** Stop the server. */
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.close((err) => (err ? reject(err) : resolve()));
        });
    }

    /** Reset request counters. */
    resetCounters(): void {
        this.summaryRequestCount = 0;
        this.promptTypesRequestCount = 0;
    }

    // ── Request routing ───────────────────────────────────────────────────────

    private async handleRequest(
        req: IncomingMessage,
        res: ServerResponse
    ): Promise<void> {
        const url = req.url ?? '/';
        const method = (req.method ?? 'GET').toUpperCase();

        if (method === 'OPTIONS') {
            res.writeHead(204, CORS_HEADERS);
            res.end();
            return;
        }

        if (method === 'GET' && url === '/ai/prompt-types') {
            this.promptTypesRequestCount++;
            this.handlePromptTypes(res);
        } else if (method === 'POST' && url === '/ai/summary') {
            this.summaryRequestCount++;
            await this.handleSummary(req, res);
        } else {
            sendJson(res, 404, {
                message: `Route not found: ${method} ${url}`,
            });
        }
    }

    // ── GET /ai/prompt-types ──────────────────────────────────────────────────

    private handlePromptTypes(res: ServerResponse): void {
        sendJson(res, 200, { items: this.options.promptTypes });
    }

    // ── POST /ai/summary ──────────────────────────────────────────────────────

    private async handleSummary(
        req: IncomingMessage,
        res: ServerResponse
    ): Promise<void> {
        // Validate Content-Type is multipart/form-data
        const contentType = req.headers['content-type'] ?? '';
        if (!contentType.includes('multipart/form-data')) {
            sendJson(res, 400, {
                message: `Expected multipart/form-data, got: ${contentType}`,
            });
            return;
        }

        // Consume request body before responding
        await consumeBody(req);

        // Respond with a plain HTTP error if configured
        if (this.options.summaryHttpError) {
            sendJson(res, this.options.summaryHttpError.status, {
                message: this.options.summaryHttpError.message,
                ...(this.options.summaryHttpError.stacktrace
                    ? { stacktrace: this.options.summaryHttpError.stacktrace }
                    : {}),
            });
            return;
        }

        // Stream SSE events
        res.writeHead(200, {
            ...CORS_HEADERS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Transfer-Encoding': 'chunked',
        });

        for (const event of this.options.summaryEvents) {
            if (this.options.eventIntervalMs > 0) {
                await sleep(this.options.eventIntervalMs);
            }
            res.write(formatSseEvent(event));
        }

        res.end();
    }
}

new AiMockServer({ eventIntervalMs: 100 }).start().then((r) => console.log(r));
