<script setup lang="ts">
/**
 * /forms/edit?path=<path> — Edit a form.
 * Path is the URL-encoded form path.
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
    () => `form-edit-${formPath.value}`,
    () => orpc.forms.get({ params: { id: formPath.value } }),
    { watch: [formPath] }
);
const pending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(formError, status);

const { set: setBreadcrumb } = useAppBreadcrumb();
watch(
    form,
    (f) => {
        if (f) setBreadcrumb('forms', f, t('forms.edit.title'));
    },
    { immediate: true }
);

const editTitle = ref('');
const editDescription = ref('');
const editSlug = ref('');
const formTouched = ref(false);
const showEditTitleInvalid = computed(
    () => formTouched.value && !editTitle.value.trim()
);
function editTitleState(): boolean | undefined {
    return showEditTitleInvalid.value ? false : undefined;
}
const formValid = computed(() => editTitle.value.trim().length > 0);
const submitting = ref(false);
const errorMsg = ref<string | null>(null);

watch(form, (f) => {
    if (f) {
        editTitle.value = f.title ?? '';
        editDescription.value = f.description ?? '';
        editSlug.value = f.name ?? '';
    }
});

async function submit() {
    formTouched.value = true;
    if (!formValid.value) {
        submitting.value = false;
        return;
    }
    submitting.value = true;
    errorMsg.value = null;
    try {
        await orpc.forms.update({
            params: { id: formPath.value },
            query: { id: formPath.value },
            body: {
                title: editTitle.value.trim(),
                description: editDescription.value.trim() || null,
            } as any,
        });
        router.push(Routes.formsDetail(formPath.value));
    } catch (err: any) {
        errorMsg.value = err?.message ?? String(err);
    } finally {
        submitting.value = false;
    }
}

function goDetail() {
    router.push(Routes.formsDetail(formPath.value));
}
</script>

<template>
    <BasePage
        icon="pencil"
        :title="t('forms.edit.title')"
        :description="t('forms.edit.subtitle')"
    >
        <BCard v-if="pending">
            <BCardBody
                ><div class="d-flex flex-column gap-3">
                    <BPlaceholder
                        animation="glow"
                        width="100%"
                        height="2.5rem"
                    />
                    <BPlaceholder
                        animation="glow"
                        width="100%"
                        height="2.5rem"
                    /></div
            ></BCardBody>
        </BCard>
        <template v-else-if="hasError">
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
        <BCard v-else-if="form">
            <BCardBody>
                <BForm
                    class="d-flex flex-column gap-3"
                    :validated="formTouched"
                    @submit.prevent="submit"
                >
                    <BRow class="g-2">
                        <BCol cols="2">
                            <BFormGroup
                                label="ID"
                                label-class="fw-medium text-secondary small"
                            >
                                <BFormInput
                                    :model-value="form.id"
                                    disabled
                                    class="opacity-50"
                                />
                            </BFormGroup>
                        </BCol>
                        <BCol>
                            <BFormGroup
                                :label="t('groups.edit.fields.path')"
                                label-class="fw-medium text-secondary small"
                            >
                                <BFormInput
                                    :model-value="'/' + formPath"
                                    disabled
                                    class="font-monospace opacity-50"
                                />
                            </BFormGroup>
                        </BCol>
                        <BCol cols="4">
                            <BFormGroup
                                :label="t('forms.edit.fields.name')"
                                label-class="fw-medium text-secondary small"
                            >
                                <BFormInput
                                    :model-value="editSlug"
                                    disabled
                                    class="font-monospace opacity-50"
                                />
                            </BFormGroup>
                        </BCol>
                    </BRow>
                    <BFormGroup
                        :label="t('forms.edit.fields.title')"
                        label-class="fw-medium"
                        required
                    >
                        <BFormInput
                            v-model="editTitle"
                            :placeholder="
                                t('forms.edit.fields.titlePlaceholder')
                            "
                            :state="editTitleState()"
                            autofocus
                            :required="true"
                        />
                        <BFormInvalidFeedback
                            :force-show="showEditTitleInvalid"
                        >
                            {{ t('common.required') }}
                        </BFormInvalidFeedback>
                    </BFormGroup>
                    <BFormGroup
                        :label="t('forms.edit.fields.description')"
                        label-class="fw-medium"
                    >
                        <BFormTextarea
                            v-model="editDescription"
                            :placeholder="
                                t('forms.edit.fields.descriptionPlaceholder')
                            "
                            rows="3"
                        />
                    </BFormGroup>
                    <BAlert
                        v-if="errorMsg"
                        variant="danger"
                        :dismissible="false"
                        >{{ errorMsg }}</BAlert
                    >
                    <div class="d-flex justify-content-end gap-2 pt-2">
                        <BButton
                            variant="outline-secondary"
                            @click="goDetail"
                            >{{ t('common.cancel') }}</BButton
                        >
                        <BButton
                            type="submit"
                            variant="primary"
                            :disabled="submitting"
                        >
                            <BSpinner v-if="submitting" small class="me-1" />{{
                                t('forms.edit.save')
                            }}
                        </BButton>
                    </div>
                </BForm>
            </BCardBody>
        </BCard>
    </BasePage>
</template>
