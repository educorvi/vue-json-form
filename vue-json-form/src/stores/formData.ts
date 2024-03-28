import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Ref } from 'vue';
import { generateUUID } from '@/Commons';

export const useFormDataStore = defineStore('formData', () => {
    const formData: Ref<Record<string, any>> = ref({});
    return { formData };
});
