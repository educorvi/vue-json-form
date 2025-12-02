import type { SubmitOptions } from '@educorvi/vue-json-form-schemas';
import { computed, defineProps, defineEmits, type PropType, type DefineProps } from 'vue';
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
    (e: 'afterSubmitted', data: Record<string, any>, options: SubmitOptions): void;
}

export function getComputed(props: Props) {
    const jsonSchema = computed(() => {
        try{
            return JSON.parse(props.jsonSchema) as Record<string, any>
        } catch (e) {
            console.warn('Could not parse JSON Schema', e);
            return undefined
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
    const presetData = computed(()=>{
        if (!props.presetData) {
            return undefined;
        }
        try {
            return JSON.parse(props.presetData) as Record<string, any>;
        } catch (e) {
            console.warn('Could not parse pre-set data', e);
            return undefined;
        }
    })
    const returnDataAsScopes = computed(() => props.returnDataAsScopes === true || props.returnDataAsScopes === 'true');
    return { jsonSchema, uiSchema, presetData, returnDataAsScopes };
}

export function getSubmitFunc(emit: Emits) {
    return async function onSubmitForm(data: Record<string, any>, options: SubmitOptions) {
        if (options.action === 'request' && options.request?.url) {
            await axios(options.request.url, {
                method: options.request.method || 'POST',
                headers: options.request.headers,
                data,
            });
        } else {
            emit('submit', data, options);
        }
        emit('afterSubmitted', data, options);
    };
}
