<script setup lang="ts">
/**
 * Client-only wrapper around the form-builder webcomponent
 * (`<vue-json-form-builder>`).
 *
 * The webcomponent is consumed the way it is meant to be consumed: as a
 * self-contained script, NOT through the bundler. The built dist files are
 * synced into `public/vendor/` by `yarn sync:webcomponent` (runs
 * automatically on `postinstall`). Re-bundling the ES output would break —
 * its internal chunks are not self-contained and collide when Rollup
 * re-processes them.
 *
 * The script is injected on mount (client only, never during SSR) and the
 * component waits for `customElements.whenDefined()` before rendering.
 */
const props = defineProps<{
    /** Base URL of the backend the webcomponent authenticates against. */
    backendUrl?: string;
    /** kc_idp_hint forwarded to the backend's Keycloak login. */
    keycloakIdpHint?: string;
    /** WebSocket URL of the Hocuspocus collab server (form loading). */
    collabUrl?: string;
    /** Document name = the form's numeric id in the backend. */
    collabDocumentName?: string;
    /** Current user (awareness/presence display only). */
    collabUserId?: string;
    collabUserName?: string;
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
            :backend-url="props.backendUrl"
            :keycloak-idp-hint="props.keycloakIdpHint"
            :collab-url="props.collabUrl"
            :collab-document-name="props.collabDocumentName"
            :collab-user-id="props.collabUserId"
            :collab-user-name="props.collabUserName"
        ></vue-json-form-builder>
    </div>
</template>
