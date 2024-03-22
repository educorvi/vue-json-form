import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Ref } from 'vue';
import { generateUUID } from '@/Commons';

export const useFormDataStore = defineStore('formData', () => {
    const formData: Ref<Record<string, any>> = ref({});
    const tempKey: Ref<string> = ref(`temp_${generateUUID()}`);
    formData.value[tempKey.value] = {};
    formData.value[tempKey.value] = {};
    return { formData, tempKey };
});
