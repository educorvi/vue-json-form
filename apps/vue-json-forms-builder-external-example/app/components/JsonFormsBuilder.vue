<script setup lang="ts">
const props = defineProps<{
    kcUrl?: string;
    kcRealm?: string;
    kcClientId?: string;
    kcIdpHint?: string;
    collabUrl?: string;
    collabDocumentName?: string;
    backendUrl?: string;
}>();

const loaded = ref(false);
const loadError = ref<string | null>(null);

onMounted(async () => {
    try {
        if (!customElements.get('vue-json-form-builder')) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.type = 'module';
                script.src = '/vendor/vue-json-form-builder.js';
                script.onload = () => resolve();
                script.onerror = () =>
                    reject(
                        new Error(
                            'Failed to load /vendor/vue-json-form-builder.js. ' +
                                'Run `yarn sync:webcomponent` (after building the ' +
                                'webcomponent package) and restart the dev server.'
                        )
                    );
                document.head.appendChild(script);
            });
        }
        await customElements.whenDefined('vue-json-form-builder');
        loaded.value = true;
    } catch (error) {
        loadError.value =
            error instanceof Error ? error.message : String(error);
    }
});
</script>

<template>
    <!-- h-100 + flex column: the webcomponent host fills the remaining
         height (the custom element's :host rule sets display:block,
         width/height:100%), so the builder scrolls internally. -->
    <div class="h-100 d-flex flex-column overflow-hidden">
        <div
            v-if="loadError"
            class="alert alert-danger m-3 flex-shrink-0"
            role="alert"
        >
            {{ loadError }}
        </div>

        <div
            v-else-if="!loaded"
            class="text-center text-secondary py-4 border rounded bg-white m-3 flex-shrink-0"
        >
            <span
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
            ></span>
            Loading form builder…
        </div>

        <vue-json-form-builder
            v-else
            class="flex-grow-1"
            style="min-height: 0"
            :kc-url="props.kcUrl"
            :kc-realm="props.kcRealm"
            :kc-client-id="props.kcClientId"
            :kc-idp-hint="props.kcIdpHint"
            :collab-url="props.collabUrl"
            :collab-document-name="props.collabDocumentName"
            :backend-url="props.backendUrl"
        ></vue-json-form-builder>
    </div>
</template>
