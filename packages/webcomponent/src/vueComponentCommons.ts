import type {
    SubmitOptions,
    SubmitRequestOptions,
} from '@educorvi/vue-json-form-schemas';
import { computed } from 'vue';
import axios from 'axios';
import type { SseEvent, SummaryResultEvent } from '@/types.ts';

export type Props = {
    /**
     * The JSON Schema of the form
     */
    jsonSchema: string;

    /**
     * The UI Schema of the form
     */
    uiSchema?: string;

    /**
     * The plain data of the form
     */
    presetData?: string;

    /**
     * Return data as key value pairs with the keys being the scopes as used in the ui schema and the values being the data
     */
    returnDataAsScopes?: boolean | string;
};

export type Emits = {
    (e: 'submit', data: Record<string, any>, options: SubmitOptions): void;
    (
        e: 'submitSucceeded',
        data: Record<string, any>,
        options: SubmitOptions
    ): void;
    (
        e: 'submitFailed',
        data: Record<string, any>,
        options: SubmitOptions
    ): void;
    (
        e: 'afterSubmitted',
        data: Record<string, any>,
        options: SubmitOptions
    ): void;
};

export function getComputed(props: Props) {
    const jsonSchema = computed(() => {
        try {
            return JSON.parse(props.jsonSchema) as Record<string, any>;
        } catch (e) {
            console.warn('Could not parse JSON Schema', e);
            return undefined;
        }
    });
    const uiSchema = computed(() => {
        if (!props.uiSchema) {
            return undefined;
        }
        try {
            return JSON.parse(props.uiSchema) as Record<string, any>;
        } catch (e) {
            console.warn('Could not parse UI Schema', e);
            return undefined;
        }
    });
    const presetData = computed(() => {
        if (!props.presetData) {
            return undefined;
        }
        try {
            return JSON.parse(props.presetData) as Record<string, any>;
        } catch (e) {
            console.warn('Could not parse pre-set data', e);
            return undefined;
        }
    });
    const returnDataAsScopes = computed(
        () =>
            props.returnDataAsScopes === true ||
            props.returnDataAsScopes === 'true'
    );
    return { jsonSchema, uiSchema, presetData, returnDataAsScopes };
}

// ── SSE stream parser ─────────────────────────────────────────────────────────

async function* parseSseStream(
    stream: ReadableStream<Uint8Array>
): AsyncGenerator<SseEvent> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    function* yieldBlocks(): Generator<SseEvent> {
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
            let eventName = '';
            let dataStr = '';

            for (const line of block.split('\n')) {
                if (line.startsWith('event: ')) {
                    eventName = line.slice(7).trim();
                } else if (line.startsWith('data: ')) {
                    dataStr = line.slice(6).trim();
                }
            }

            if (!eventName || !dataStr) continue;

            try {
                const parsed = JSON.parse(dataStr);
                yield { event: eventName, data: parsed } as SseEvent;
            } catch {
                console.warn(
                    '[vue-json-form] Could not parse SSE data:',
                    dataStr
                );
            }
        }
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        yield* yieldBlocks();
    }

    // Flush any bytes held by the decoder and process the final block
    buffer += decoder.decode();
    yield* yieldBlocks();
}

// ── SSE event logging ─────────────────────────────────────────────────────────

function logSseEvent(event: SseEvent): void {
    switch (event.event) {
        case 'progress': {
            const { stage, status, current, total, message } = event.data;
            const paging =
                current !== undefined && total !== undefined
                    ? ` (${current}/${total})`
                    : '';
            const msg = message ? ` – ${message}` : '';
            console.log(
                `[vue-json-form] SSE progress: ${stage} ${status}${paging}${msg}`
            );
            break;
        }
        case 'result':
            console.log('[vue-json-form] SSE result: summary received');
            break;
        case 'error':
            console.error(
                `[vue-json-form] SSE error: ${event.data.message}` +
                    (event.data.details ? ` (${event.data.details})` : '')
            );
            break;
    }
}

// ── Public summary request ────────────────────────────────────────────────────

/**
 * POST multipart/form-data to the /ai/summary SSE endpoint, log every
 * progress/result/error event to the console, and resolve with the final
 * summary text.
 */
export async function requestSummary(
    url: string,
    document: Blob | File,
    promptType: string,
    updateState?: ((event: SseEvent) => void) | undefined
): Promise<SummaryResultEvent> {
    const formData = new FormData();
    formData.append('promptType', promptType);
    formData.append('document', document);

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok || !response.body) {
        let message = `Summary request failed with status ${response.status}`;
        try {
            const body = await response.json();
            if (typeof body.message === 'string') message = body.message;
        } catch {
            // ignore parse error, keep generic message
        }
        throw new Error(message);
    }

    let result: SummaryResultEvent | null = null;

    for await (const event of parseSseStream(response.body)) {
        logSseEvent(event);
        if (updateState) {
            updateState(event);
        } else {
            console.warn('updateState is undefined, skipping state update');
        }
        if (event.event === 'result') {
            result = event.data;
        } else if (event.event === 'error') {
            throw new Error(event.data.message);
        }
    }

    if (!result) {
        throw new Error('No result event received from summary stream');
    }

    return result;
}

// ── Submit helpers ────────────────────────────────────────────────────────────

function logStatusEvent(event: string): void {
    console.log(`[vue-json-form] status event: ${event}`);
}

async function request(
    url: string,
    method: NonNullable<SubmitRequestOptions['method']>,
    headers: SubmitRequestOptions['headers'],
    data: Record<string, any>
) {
    let success = true;
    try {
        await axios(url, {
            method,
            headers,
            data,
        });
    } catch (e) {
        success = false;
        console.error('Failed to submit form');
        console.error(e);
    }

    return success;
}

export function getSubmitFunc(
    emit: Emits,
    updateStage?: (event: SseEvent) => void
) {
    return async function onSubmitForm(
        data: Record<string, any>,
        options: SubmitOptions
    ) {
        let success = true;
        if (options.action === 'summary' && options.summary) {
            const file = await (
                await fetch(data[options.summary.field])
            ).blob();
            await requestSummary(
                options.summary.apiEndpoint,
                file,
                'none',
                updateStage
            );
            return;
        }
        if (options.action === 'request') {
            if (Array.isArray(options.request?.url)) {
                if (options.request.url.length === 0) {
                    // Fallback to normal submit when no URLs are configured
                    logStatusEvent('submit');
                    emit('submit', data, options);
                } else {
                    for (const url of options.request.url) {
                        const res = await request(
                            url,
                            options.request.method || 'POST',
                            options.request.headers,
                            data
                        );
                        if (!res) {
                            success = false;
                            break;
                        }
                    }
                }
            } else if (options.request?.url) {
                success = await request(
                    options.request.url,
                    options.request.method || 'POST',
                    options.request.headers,
                    data
                );
            } else {
                // Fallback to normal submit when request or request.url is missing
                logStatusEvent('submit');
                emit('submit', data, options);
            }
        } else {
            logStatusEvent('submit');
            emit('submit', data, options);
        }

        if (success) {
            logStatusEvent('submitSucceeded');
            emit('submitSucceeded', data, options);
            if (options.request?.onSuccessRedirect) {
                window.location.href = options.request.onSuccessRedirect;
            }
        } else {
            logStatusEvent('submitFailed');
            emit('submitFailed', data, options);
        }

        logStatusEvent('afterSubmitted');
        emit('afterSubmitted', data, options);
    };
}
