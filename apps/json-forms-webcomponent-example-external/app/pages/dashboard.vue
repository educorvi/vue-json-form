<script setup lang="ts">
definePageMeta({ middleware: 'authenticated' });

const { user } = useUserSession();
const config = useRuntimeConfig();

const kcUrl = computed(() => config.public.kcUrl as string);
const kcRealm = computed(() => config.public.kcRealm as string);
const kcClientId = computed(() => config.public.kcClientId as string);
const kcIdpHint = computed(() => config.public.kcIdpHint as string);
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
// that keycloak-js obtained (silent check-sso; `kc_idp_hint` sends the login
// through the external Keycloak, so the user is already signed in here).
//
// The builder is only mounted after the user CONFIRMS the id (Load form
// button / Enter) — typing alone never loads anything. The confirmed id is
// mirrored into the URL query (?formId=…), so after the Keycloak login
// redirects back to this page the form loads directly without a second
// confirmation. The collab server additionally rejects the connection when
// the form does not exist or the user lacks edit access; the builder then
// shows the error inline.

const route = useRoute();
const router = useRouter();

const formId = ref(
    typeof route.query.formId === 'string' ? route.query.formId : ''
);
/** The form id the user confirmed — only then is the builder mounted. */
const confirmedFormId = ref(
    typeof route.query.formId === 'string' ? route.query.formId : ''
);

async function loadForm() {
    const id = formId.value.trim();
    if (!id) return;
    // Commit the URL BEFORE mounting the builder: the webcomponent captures
    // location.href as its Keycloak redirectUri when it mounts, so the
    // post-login return would otherwise land on the previously confirmed
    // form id (race — reliably reproduced in Firefox). The stale OAuth
    // hash is dropped too, so a new login round-trip starts from a clean
    // redirect_uri.
    try {
        await router.replace({
            query: { ...route.query, formId: id },
            hash: '',
        });
    } catch {
        // Navigation failed/aborted — still mount the requested form.
    }
    confirmedFormId.value = id;
}
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
                @keyup.enter="loadForm"
            />
            <BButton
                size="sm"
                variant="primary"
                :disabled="!formId.trim()"
                @click="loadForm"
            >
                Load form
            </BButton>
            <span class="text-secondary small">
                The form is loaded over the collab websocket only after you
                confirm — the builder authenticates against kc1 with keycloak-js
                (silent check-sso) and
                <code>kc_idp_hint</code> pointing back to the external Keycloak.
                The connection is rejected (with an inline error) when the form
                does not exist or you have no edit access.
            </span>
        </div>

        <main
            class="d-flex flex-column flex-grow-1 overflow-hidden"
            style="min-height: 0"
        >
            <JsonFormsBuilder
                v-if="confirmedFormId"
                :key="confirmedFormId"
                class="flex-grow-1 d-flex flex-column"
                style="min-height: 0"
                :kc-url="kcUrl"
                :kc-realm="kcRealm"
                :kc-client-id="kcClientId"
                :kc-idp-hint="kcIdpHint"
                :collab-url="collabUrl"
                :collab-document-name="confirmedFormId"
                :collab-user-id="user?.id ?? undefined"
                :collab-user-name="greeting"
            />
            <p
                v-else
                class="text-secondary border rounded bg-white p-4 text-center m-3"
            >
                Enter a form id and press <strong>Load form</strong> to open it
                in the form builder.
            </p>
        </main>
    </div>
</template>
