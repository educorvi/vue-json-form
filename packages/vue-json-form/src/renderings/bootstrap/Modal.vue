<script setup lang="ts">
import type { ModalProps } from '@/renderings/PropsAndEmitsForRenderings.ts';
import { BButton, BModal } from 'bootstrap-vue-next';
import { computed, inject, ref } from 'vue';
import HtmlRenderer from '@/components/LayoutElements/htmlRenderer.vue';
import type { HTMLRenderer } from '@educorvi/vue-json-form-schemas';
import { languageProviderKey } from '@/components/ProviderKeys.ts';

import { getHtmlMessages } from '@/renderings/renderHelpers';

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
            return undefined;
    }
});

const modalContentUi = computed<HTMLRenderer>(() => {
    return {
        type: 'HTML',
        htmlData: props.layoutElement.modal.content,
    };
});

const languageProvider = inject(languageProviderKey);
const htmlMessages = computed(() => getHtmlMessages(props.layoutElement));
</script>

<template>
    <div class="vjf_modal_control">
        <html-renderer
            v-if="htmlMessages.pre"
            :layout-element="htmlMessages.pre"
        />
        <BButton
            :variant="layoutElement.button.variant || 'info'"
            @click="modal = true"
            >{{ layoutElement.button.text }}</BButton
        >
        <html-renderer
            v-if="htmlMessages.post"
            :layout-element="htmlMessages.post"
        />
        <BModal
            v-model="modal"
            :size="size"
            centered
            scrollable
            :title="layoutElement.modal.title"
            class="vjf_modal"
        >
            <HtmlRenderer :layout-element="modalContentUi" />

            <template #footer>
                <BButton variant="primary" class="w-100" @click="modal = false">
                    {{
                        languageProvider?.getString('buttons.close') || 'Close'
                    }}
                </BButton>
            </template>
        </BModal>
    </div>
</template>

<style scoped>
.vjf_modal_control {
    display: flex;
    flex-direction: column;
}
</style>
