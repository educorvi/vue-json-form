import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';
import type { UISchema } from '@/typings/ui-schema';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import type { RenderInterface } from '@/RenderInterface';

export const useFormStructureStore = defineStore('formStructure', () => {
    const jsonSchema: Ref<CoreSchemaMetaSchema | null> = ref(null);
    const uiSchema: Ref<UISchema | null> = ref(null);

    const components: Ref<RenderInterface | undefined> = ref(undefined);

    return { jsonSchema, uiSchema, components };
});
