import type { SubmitOptions,SubmitRequestOptions } from '@educorvi/vue-json-form-schemas';
import { computed } from 'vue';
import axios from 'axios';

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
}

export type Emits = {
    (e: 'submit', data: Record<string, any>, options: SubmitOptions): void;
    (e: 'submitSucceeded', data: Record<string, any>, options: SubmitOptions): void;
    (e: 'submitFailed', data: Record<string, any>, options: SubmitOptions): void;
    (e: 'afterSubmitted', data: Record<string, any>, options: SubmitOptions): void;
}

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
    const returnDataAsScopes = computed(() => props.returnDataAsScopes === true || props.returnDataAsScopes === 'true');
    return { jsonSchema, uiSchema, presetData, returnDataAsScopes };
}

async function request(url: string, method: NonNullable<SubmitRequestOptions['method']>, headers: SubmitRequestOptions['headers'], data: Record<string, any>) {
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

export function getSubmitFunc(emit: Emits) {
    return async function onSubmitForm(data: Record<string, any>, options: SubmitOptions) {
        let success = true;
        if (options.action === 'request') {
            if (Array.isArray(options.request?.url)) {
                for (const url of options.request.url) {
                    const res =await request(url, options.request.method || 'POST', options.request.headers, data);
                    if (!res) {
                        success = false;
                        break;
                    }
                }
            } else if (options.request?.url) {
                success = await request(options.request.url, options.request.method || 'POST', options.request.headers, data);
            }
        } else {
            emit('submit', data, options);
        }

        if (success) {
            emit('submitSucceeded', data, options);
            if (options.request?.onSuccessRedirect) {
                window.location.href = options.request.onSuccessRedirect;
            }
        } else {
            emit('submitFailed', data, options);
        }

        emit('afterSubmitted', data, options);
    };
}
