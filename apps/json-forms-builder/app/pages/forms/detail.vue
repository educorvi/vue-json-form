<script setup lang="ts">
/**
 * /forms/detail?path=<path> — Form detail view.
 * Path is the URL-encoded form path (e.g. "bug-report%2Fexample-bug-report").
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const formPath = computed(() =>
    decodeURIComponent((route.query.path as string) ?? '')
);

const {
    data: form,
    error: formError,
    status,
} = useAsyncData(
    () => `form-detail-${formPath.value}`,
    () => orpc.forms.get({ params: { id: formPath.value } }),
    { watch: [formPath] }
);
const pending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(formError, status);

const { set: setBreadcrumb } = useAppBreadcrumb();
watch(
    form,
    (f) => {
        if (f) setBreadcrumb('forms', f);
    },
    { immediate: true }
);

function formatTimestamp(iso: string | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

const showDeleteModal = ref(false);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

async function onDeleteConfirm() {
    if (!form.value) return;
    deletePending.value = true;
    deleteError.value = null;
    try {
        await orpc.forms.delete({ params: { id: String(form.value.id) } });
        showDeleteModal.value = false;
        router.push(Routes.FORMS);
    } catch (err: any) {
        deleteError.value = err?.message ?? String(err);
    } finally {
        deletePending.value = false;
    }
}

function goEdit() {
    router.push(Routes.formsEdit(formPath.value));
}
</script>

<template>
    <BasePage
        :title="form?.title || '...'"
        :description="form?.description ?? undefined"
        icon="file-text"
    >
        <template v-if="form" #actions>
            <BButton
                variant="outline-secondary"
                size="sm"
                @click="goEdit"
                class="me-2"
            >
                <PhosphorIcon name="pencil" :size="14" class="me-1" />{{
                    t('common.edit')
                }}
            </BButton>
            <BButton
                variant="outline-danger"
                size="sm"
                @click="showDeleteModal = true"
            >
                <PhosphorIcon name="trash" :size="14" class="me-1" />{{
                    t('forms.delete.title')
                }}
            </BButton>
        </template>

        <template v-if="hasError">
            <BaseErrorState
                v-if="isNotFound"
                icon="warning-circle"
                :title="t('forms.detail.notFound')"
                :description="errorMessage"
                :action-route="Routes.FORMS"
                :action-label="t('forms.detail.backToForms')"
            />
            <BaseErrorState
                v-else
                icon="bug"
                :title="t('common.errorTitle')"
                :description="errorMessage"
                :action-route="Routes.FORMS"
                :action-label="t('forms.detail.backToForms')"
            />
        </template>

        <div v-else-if="pending" class="mb-4">
            <BPlaceholder animation="glow" class="mb-2" width="50%" />
            <BPlaceholder animation="glow" width="30%" />
        </div>

        <!-- Form detail -->
        <BCard v-else-if="form">
            <BCardBody>
                <dl class="row mb-0 g-3">
                    <dt class="col-sm-2 text-secondary small fw-medium">
                        {{ t('groups.edit.fields.path') }}
                    </dt>
                    <dd class="col-sm-10 mb-0">
                        <div
                            class="d-flex align-items-center gap-2 font-monospace text-secondary flex-wrap"
                        >
                            <template
                                v-for="(entry, idx) in form.parent_path || []"
                                :key="idx"
                            >
                                <NuxtLink
                                    :to="
                                        Routes.groupsDetail(
                                            (form.parent_path || [])
                                                .slice(0, (idx as number) + 1)
                                                .map(
                                                    (p: any) =>
                                                        p.path_segment ?? p.name
                                                )
                                                .join('/')
                                        )
                                    "
                                    class="text-decoration-none text-secondary"
                                    >{{ entry.name }}</NuxtLink
                                >
                                <span class="mx-1">/</span>
                            </template>
                            <span class="text-body fw-medium">{{
                                form.title
                            }}</span>
                        </div>
                    </dd>

                    <div class="w-100"><hr class="my-1" /></div>

                    <dt class="col-sm-2 text-secondary small fw-medium">ID</dt>
                    <dd class="col-sm-10 mb-0 text-body">{{ form.id }}</dd>

                    <dt class="col-sm-2 text-secondary small fw-medium">
                        {{ t('forms.edit.fields.title') }}
                    </dt>
                    <dd class="col-sm-10 mb-0 text-body">{{ form.title }}</dd>

                    <dt class="col-sm-2 text-secondary small fw-medium">
                        {{ t('forms.edit.fields.description') }}
                    </dt>
                    <dd class="col-sm-10 mb-0 text-body text-pre-line">
                        {{ form.description || '-' }}
                    </dd>

                    <div class="w-100"><hr class="my-1" /></div>

                    <dt class="col-sm-2 text-secondary small fw-medium">
                        {{ t('users.created') }}
                    </dt>
                    <dd class="col-sm-10 mb-0 text-body">
                        {{ formatTimestamp(form.created_by?.timestamp) }}
                    </dd>

                    <dt class="col-sm-2 text-secondary small fw-medium">
                        {{ t('groups.updated') }}
                    </dt>
                    <dd class="col-sm-10 mb-0 text-body">
                        {{ formatTimestamp(form.updated_by?.timestamp) }}
                    </dd>
                </dl>
            </BCardBody>
        </BCard>

        <BModal
            v-model="showDeleteModal"
            :title="t('forms.delete.title')"
            ok-variant="danger"
            :ok-title="t('forms.delete.confirm')"
            :cancel-title="t('common.cancel')"
            :ok-disabled="deletePending"
            @ok="onDeleteConfirm"
        >
            <p>{{ t('forms.delete.warning') }}</p>
            <BAlert
                v-if="deleteError"
                variant="danger"
                :dismissible="false"
                class="mb-0"
                >{{ deleteError }}</BAlert
            >
        </BModal>
    </BasePage>
</template>
