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

const iconClass = computed(() => {
    const icon = props.layoutElement.button.variant?.startsWith('outline-')
        ? 'bi-info-square'
        : 'bi-info-square-fill';
    const color =
        'text-' +
        (props.layoutElement.button.variant || 'primary').replace(
            'outline-',
            ''
        );
    return `bi ${icon} ${color}`;
});
</script>

<template>
    <div class="vjf_modal_control mb-2 mt-2">
        <html-renderer
            v-if="htmlMessages.pre"
            :layout-element="htmlMessages.pre"
        />
        <template v-if="layoutElement.button.asLink">
            <a
                href="#"
                class="vjf_info-modal-link"
                @click.prevent="modal = true"
            >
                <i :class="iconClass" style="font-size: 1.75rem" />
                <span class="ms-2">
                    {{ layoutElement.button.text }}
                </span>
            </a>
        </template>
        <template v-else>
            <BButton
                :variant="layoutElement.button.variant || 'info'"
                @click="modal = true"
            >
                {{ layoutElement.button.text }}
            </BButton>
        </template>

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

.vjf_info-modal-link {
    display: flex;
    flex-direction: row;
    align-items: center;

    text-decoration: none;
    color: inherit;

    &:hover {
        text-decoration: underline;
    }
}
</style>
