<script setup lang="ts">
import type { ModalProps } from '@/renderings/PropsAndEmitsForRenderings.ts';
import { BButton, BModal } from 'bootstrap-vue-next';
import { computed, inject, ref } from 'vue';
import HtmlRenderer from '@/components/LayoutElements/htmlRenderer.vue';
import type { HTMLRenderer } from '@educorvi/vue-json-form-schemas';
import { languageProviderKey } from '@/components/ProviderKeys.ts';

const props = defineProps<ModalProps>();

const modal = ref(false);

const size = computed(() => {
    switch (props.layoutElement.modal.size) {
        case 'small':
            return 'sm';
        case 'large':
            return 'lg';
        case 'x-large':
            return 'xl';
        default:
            return 'md';
    }
});

const modalContentUi = computed<HTMLRenderer>(() => {
    return {
        type: 'HTML',
        htmlData: props.layoutElement.modal.content,
    };
});

const languageProvider = inject(languageProviderKey);
</script>

<template>
    <BButton
        @click="modal = true"
        :variant="layoutElement.button?.variant || 'info'"
        >{{ layoutElement.button.text }}</BButton
    >
    <BModal
        v-model="modal"
        :size="size"
        centered
        scrollable
        :title="layoutElement.modal.title"
    >
        <HtmlRenderer :layout-element="modalContentUi" />

        <template #footer>
            <BButton variant="primary" class="w-100" @click="modal = false">
                {{ languageProvider?.getString('buttons.close') || 'Close' }}
            </BButton>
        </template>
    </BModal>
</template>

<style scoped></style>
