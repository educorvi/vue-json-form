<script setup lang="ts">
definePageMeta({ middleware: 'authenticated' });

const { user } = useUserSession();
const config = useRuntimeConfig();

const backendUrl = computed(() => config.public.backendUrl as string);
const keycloakIdpHint = computed(() => config.public.keycloakIdpHint as string);
const collabUrl = computed(() => config.public.collabUrl as string);

const greeting = computed(
    () =>
        user.value?.firstName ||
        user.value?.username ||
        user.value?.email ||
        'User'
);

// The form is NOT fetched over REST — the builder webcomponent loads it over
// the collab websocket (like in the main builder app): Hocuspocus hydrates
// the Y.Doc from the form's stored definition, keyed by document name = the
// form's NUMERIC id. The websocket authenticates with the kc1 access token
// that the webcomponent's login popup relayed back (falling back to the
// session cookie in browsers that allow third-party cookies).

const formId = ref('');
</script>

<template>
    <!-- Same pattern as the main builder app: a vh-100 flex column whose
         main area does NOT scroll — the form builder handles its own
         internal scrolling. The builder therefore always gets the full
         remaining display height at full width. -->
    <div class="d-flex flex-column vh-100 bg-body-tertiary overflow-hidden">
        <BNavbar variant="light" class="border-bottom bg-white flex-shrink-0">
            <BNavbarBrand href="/">
                <i class="bi bi-braces me-1"></i>
                Example External App
            </BNavbarBrand>
            <div class="ms-auto d-flex align-items-center gap-3">
                <span class="text-secondary small">
                    Logged in via the external Keycloak as
                    <strong>{{ greeting }}</strong>
                </span>
                <form action="/auth/logout" method="post">
                    <BButton
                        type="submit"
                        size="sm"
                        variant="outline-secondary"
                    >
                        <i class="bi bi-box-arrow-right me-1"></i>
                        Logout
                    </BButton>
                </form>
            </div>
        </BNavbar>

        <div
            class="d-flex align-items-center gap-2 px-3 py-2 bg-white border-bottom flex-shrink-0 flex-wrap"
        >
            <h1 class="h6 mb-0">Hello, {{ greeting }}!</h1>
            <BFormInput
                v-model="formId"
                placeholder="Form id (number), e.g. 5"
                class="w-auto"
                style="max-width: 16rem"
                @keyup.enter="formId = formId.trim()"
            />
            <span class="text-secondary small">
                The form is loaded over the collab websocket — the builder
                authenticates against the main app (kc1) with
                <code>kc_idp_hint</code> pointing back to the external Keycloak.
            </span>
        </div>

        <main
            class="d-flex flex-column flex-grow-1 overflow-hidden"
            style="min-height: 0"
        >
            <JsonFormsBuilder
                v-if="formId.trim()"
                :key="formId.trim()"
                class="flex-grow-1 d-flex flex-column"
                style="min-height: 0"
                :backend-url="backendUrl"
                :keycloak-idp-hint="keycloakIdpHint"
                :collab-url="collabUrl"
                :collab-document-name="formId.trim()"
                :collab-user-id="user?.id ?? undefined"
                :collab-user-name="greeting"
            />
            <p
                v-else
                class="text-secondary border rounded bg-white p-4 text-center m-3"
            >
                Enter a form id to load it into the form builder.
            </p>
        </main>
    </div>
</template>
