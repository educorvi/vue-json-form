<script setup lang="ts">
/**
 * /groups/edit?path=<path> — Edit a group.
 * Path is the URL-encoded group path.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const groupPath = computed(() =>
    decodeURIComponent((route.query.path as string) ?? '')
);

const {
    data: group,
    error: groupError,
    status,
} = useAsyncData(
    () => `group-edit-${groupPath.value}`,
    () => orpc.groups.get({ params: { id: groupPath.value } }),
    { watch: [groupPath] }
);
const pending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(groupError, status);

const { set: setBreadcrumb } = useAppBreadcrumb();
watch(
    group,
    (g) => {
        if (g) setBreadcrumb('groups', g, t('groups.edit.title'));
    },
    { immediate: true }
);

const editTitle = ref('');
const editDescription = ref('');
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

watch(group, (g) => {
    if (g) {
        editTitle.value = g.title ?? '';
        editDescription.value = g.description ?? '';
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
        await orpc.groups.update({
            params: { id: groupPath.value },
            body: {
                title: editTitle.value.trim(),
                description: editDescription.value.trim() || null,
            } as any,
        });
        router.push(Routes.groupsDetail(groupPath.value));
    } catch (err: any) {
        errorMsg.value = err?.message ?? String(err);
    } finally {
        submitting.value = false;
    }
}

function goDetail() {
    router.push(Routes.groupsDetail(groupPath.value));
}
</script>

<template>
    <BasePage
        icon="pencil"
        :title="t('groups.edit.title')"
        :description="t('groups.edit.subtitle')"
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
                    />
                    <BPlaceholder
                        animation="glow"
                        width="100%"
                        height="5rem"
                    /></div
            ></BCardBody>
        </BCard>
        <template v-else-if="hasError">
            <BaseErrorState
                v-if="isNotFound"
                icon="warning-circle"
                :title="t('groups.notFound')"
                :description="errorMessage"
                :action-route="Routes.GROUPS"
                :action-label="t('groups.backToGroups')"
            />
            <BaseErrorState
                v-else
                icon="bug"
                :title="t('common.errorTitle')"
                :description="errorMessage"
                :action-route="Routes.GROUPS"
                :action-label="t('groups.backToGroups')"
            />
        </template>
        <BCard v-else-if="group">
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
                                    :model-value="group.id"
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
                                    :model-value="'/' + groupPath"
                                    disabled
                                    class="font-monospace opacity-50"
                                />
                            </BFormGroup>
                        </BCol>
                        <BCol cols="4">
                            <BFormGroup
                                :label="t('groups.edit.fields.name')"
                                label-class="fw-medium text-secondary small"
                            >
                                <BFormInput
                                    :model-value="group.name"
                                    disabled
                                    class="font-monospace opacity-50"
                                />
                            </BFormGroup>
                        </BCol>
                    </BRow>
                    <BFormGroup
                        :label="t('groups.edit.fields.title')"
                        label-class="fw-medium"
                        required
                    >
                        <BFormInput
                            v-model="editTitle"
                            :placeholder="
                                t('groups.edit.fields.titlePlaceholder')
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
                        :label="t('groups.edit.fields.description')"
                        label-class="fw-medium"
                    >
                        <BFormTextarea
                            v-model="editDescription"
                            :placeholder="
                                t('groups.edit.fields.descriptionPlaceholder')
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
                                t('groups.edit.save')
                            }}
                        </BButton>
                    </div>
                </BForm>
            </BCardBody>
        </BCard>
    </BasePage>
</template>
