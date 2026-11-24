<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type Keycloak from 'keycloak-js';

const props = defineProps<{
    formId: string;
    backendUrl: string;
    kcUrl?: string;
    kcRealm?: string;
    kcClientId?: string;
    kcIdpHint?: string;
}>();

interface FormArtifacts {
    json: Record<string, unknown>;
    ui: Record<string, unknown>;
}

const componentLoaded = ref(false);
const componentLoadError = ref<string | null>(null);
const schemaLoading = ref(false);
const schemaError = ref<string | null>(null);
const loginRequired = ref(false);
const formArtifacts = ref<FormArtifacts | null>(null);
const submittedData = ref<string | null>(null);
const jsonSchema = computed(() =>
    formArtifacts.value ? JSON.stringify(formArtifacts.value.json) : undefined
);
const uiSchema = computed(() =>
    formArtifacts.value ? JSON.stringify(formArtifacts.value.ui) : undefined
);

let keycloak: Keycloak | null = null;
let keycloakInit: Promise<boolean> | null = null;
let hasMounted = false;
let loadSequence = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function getKeycloak(): Promise<{
    client: Keycloak;
    authenticated: boolean;
}> {
    if (!props.kcUrl || !props.kcRealm || !props.kcClientId) {
        throw new Error(
            'Keycloak URL, realm, and client ID are required to load form schemas.'
        );
    }

    if (!keycloak) {
        const { default: KeycloakClient } = await import('keycloak-js');
        keycloak = new KeycloakClient({
            url: props.kcUrl,
            realm: props.kcRealm,
            clientId: props.kcClientId,
        });
        keycloakInit = keycloak.init({
            onLoad: 'check-sso',
            flow: 'standard',
            silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`,
            redirectUri: location.href,
            checkLoginIframe: false,
        });
    }

    const client = keycloak;
    const initialization = keycloakInit;
    if (!client || !initialization) {
        throw new Error('Keycloak initialization did not start.');
    }
    const authenticated = await initialization;
    return { client, authenticated };
}

async function loadArtifacts() {
    const requestId = ++loadSequence;
    formArtifacts.value = null;
    submittedData.value = null;
    schemaError.value = null;
    loginRequired.value = false;

    if (!props.formId) {
        schemaLoading.value = false;
        return;
    }

    schemaLoading.value = true;
    try {
        const { client, authenticated } = await getKeycloak();
        if (requestId !== loadSequence) return;
        if (!authenticated) {
            loginRequired.value = true;
            return;
        }

        if (client.isTokenExpired(30)) {
            await client.updateToken(30);
        }
        if (!client.token) {
            throw new Error('Keycloak did not provide an access token.');
        }

        const backendUrl = props.backendUrl.replace(/\/+$/, '');
        const response = await fetch(
            `${backendUrl}/api/v1/forms/${encodeURIComponent(props.formId)}/schema/artifacts`,
            {
                headers: {
                    Authorization: `Bearer ${client.token}`,
                },
                credentials: 'omit',
            }
        );
        if (requestId !== loadSequence) return;
        if (!response.ok) {
            throw new Error(
                `The artifact API request failed with status ${response.status}${response.statusText ? ` ${response.statusText}` : ''}.`
            );
        }

        const payload: unknown = await response.json();
        if (
            !isRecord(payload) ||
            !isRecord(payload.json) ||
            !isRecord(payload.ui)
        ) {
            throw new Error(
                'The artifact API did not return both a JSON schema and a UI schema.'
            );
        }

        formArtifacts.value = {
            json: payload.json,
            ui: payload.ui,
        };
    } catch (error) {
        if (requestId === loadSequence) {
            schemaError.value =
                error instanceof Error ? error.message : String(error);
        }
    } finally {
        if (requestId === loadSequence) {
            schemaLoading.value = false;
        }
    }
}

async function signIn() {
    try {
        const { client } = await getKeycloak();
        await client.login({
            ...(props.kcIdpHint ? { idpHint: props.kcIdpHint } : {}),
            redirectUri: location.href,
        });
    } catch (error) {
        schemaError.value =
            error instanceof Error ? error.message : String(error);
    }
}

function loadStylesheet(href: string): Promise<void> {
    if (document.querySelector(`link[href="${href}"]`)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () =>
            reject(
                new Error(`Failed to load Vue JSON Form styles from ${href}.`)
            );
        document.head.appendChild(link);
    });
}

async function loadWebcomponent(tagName: string, src: string): Promise<void> {
    if (!customElements.get(tagName)) {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.crossOrigin = 'anonymous';
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () =>
                reject(new Error(`Failed to load webcomponent from ${src}.`));
            document.head.appendChild(script);
        });
    }

    await customElements.whenDefined(tagName);
}

function onFormSubmit(event: Event) {
    if (!(event instanceof CustomEvent)) return;
    const [data] = event.detail as [Record<string, unknown>, unknown];
    submittedData.value = JSON.stringify(data, null, 2);
}

onMounted(() => {
    hasMounted = true;
    void loadArtifacts();

    const baseUrl = `${props.backendUrl.replace(/\/+$/, '')}/webcomponent`;
    void Promise.all([
        loadStylesheet(`${baseUrl}/vue-json-form.css`),
        loadWebcomponent('vue-json-form', `${baseUrl}/vue-json-form.mjs`),
    ])
        .then(() => {
            componentLoaded.value = true;
        })
        .catch((error: unknown) => {
            componentLoadError.value =
                error instanceof Error ? error.message : String(error);
        });
});

watch(
    () => props.formId,
    () => {
        if (hasMounted) void loadArtifacts();
    }
);
</script>

<template>
    <div class="h-100 overflow-auto p-3">
        <div v-if="componentLoadError" class="alert alert-danger" role="alert">
            {{ componentLoadError }}
        </div>
        <div
            v-else-if="!componentLoaded"
            class="text-center text-secondary py-4"
        >
            <span
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
            ></span>
            Loading Vue JSON Form webcomponents…
        </div>
        <div v-else-if="!formId" class="text-secondary text-center py-4">
            Enter a form id and press <strong>Load form</strong> to display its
            schema here.
        </div>
        <div v-else-if="schemaError" class="alert alert-danger" role="alert">
            {{ schemaError }}
        </div>
        <div v-else-if="loginRequired" class="text-center text-secondary py-4">
            <p>Sign in to load this form's schema.</p>
            <button class="btn btn-primary" type="button" @click="signIn">
                Sign in
            </button>
        </div>
        <div
            v-else-if="schemaLoading || !jsonSchema || !uiSchema"
            class="text-center text-secondary py-4"
        >
            <span
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
            ></span>
            Loading form schema…
        </div>

        <div v-else class="row g-3">
            <div class="col-12 col-xl-6">
                <section class="card h-100">
                    <h2 class="card-header h6 mb-0">Editable form</h2>
                    <div class="card-body">
                        <vue-json-form
                            :key="formId"
                            :json-schema="jsonSchema"
                            :ui-schema="uiSchema"
                            @submit="onFormSubmit"
                        ></vue-json-form>
                        <pre v-if="submittedData" class="mt-3 mb-0">{{
                            submittedData
                        }}</pre>
                    </div>
                </section>
            </div>
            <div class="col-12 col-xl-6">
                <section class="card h-100">
                    <h2 class="card-header h6 mb-0">Read-only form</h2>
                    <div class="card-body">
                        <fieldset
                            disabled
                            class="border-0 p-0 m-0"
                            style="min-width: 0; width: 100%"
                        >
                            <legend class="visually-hidden">
                                Read-only form
                            </legend>
                            <vue-json-form
                                :key="formId"
                                :json-schema="jsonSchema"
                                :ui-schema="uiSchema"
                            ></vue-json-form>
                        </fieldset>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>
