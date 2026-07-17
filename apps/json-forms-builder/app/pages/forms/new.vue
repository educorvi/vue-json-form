<script setup lang="ts">
/**
 * /forms/new — Create a new form.
 *
 * Field order: Title → Parent Group → URL Slug → Description
 * Query param `?parent=<encoded-path>` pre-selects the parent.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

// ── Parent group — fetch for breadcrumb ────────────────────────────────
const parentPath = ref<string | null>(
    route.query.parent ? decodeURIComponent(String(route.query.parent)) : null
);

const { data: parentGroup } = useAsyncData(
    () => `parent-group-for-form-${parentPath.value}`,
    () =>
        parentPath.value
            ? orpc.groups.get({ params: { id: parentPath.value } })
            : Promise.resolve(null),
    { watch: [parentPath], immediate: true }
);

// Breadcrumb — updated when parent group data arrives
const { set: setBreadcrumb } = useAppBreadcrumb();
watch(
    parentGroup,
    (g) => {
        setBreadcrumb('forms', g, t('forms.new.title'));
    },
    { immediate: true }
);

// ── Form state ─────────────────────────────────────────────────────────────
const title = ref('');
const slug = ref('');
const description = ref('');
const parentId = ref<number | null>(null);

// ── Sync parent ID from fetched parent group ────────────────────────────
watch(
    parentGroup,
    (g) => {
        if (g && parentId.value === null) {
            parentId.value = (g as any).id;
        }
    },
    { immediate: true }
);

// ── Slug auto-generation ───────────────────────────────────────────────────
const slugEditedByUser = ref(false);
const slugManuallyCleared = ref(false);

watch(title, (val) => {
    if (!slugEditedByUser.value) {
        slug.value = toSlug(val);
    } else if (slugManuallyCleared.value && !slug.value) {
        slugEditedByUser.value = false;
        slugManuallyCleared.value = false;
        slug.value = toSlug(val);
    }
});

function onSlugInput() {
    slugEditedByUser.value = true;
    slugManuallyCleared.value = !slug.value;
}

// ── Validation ─────────────────────────────────────────────────────────────
const SLUG_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

const slugError = computed(() => {
    if (!slug.value.trim()) return null;
    if (!SLUG_RE.test(slug.value)) return t('forms.new.fields.slugInvalid');
    return null;
});

const formTouched = ref(false);
const showTitleInvalid = computed(
    () => formTouched.value && !title.value.trim()
);
const slugInvalid = computed<boolean>(
    () => formTouched.value && (!slug.value.trim() || !!slugError.value)
);
const showSlugEmptyError = computed(
    () => formTouched.value && !slug.value.trim()
);
const showSlugFormatError = computed(
    () => formTouched.value && !!slugError.value
);
function titleState(): boolean | undefined {
    return showTitleInvalid.value ? false : undefined;
}
const formValid = computed(
    () =>
        title.value.trim().length > 0 &&
        slug.value.trim().length > 0 &&
        SLUG_RE.test(slug.value)
);

// ── Submission ─────────────────────────────────────────────────────────────
const submitting = ref(false);
const errorMessage = ref<string | null>(null);
const { notify } = useNotify();

async function submit() {
    formTouched.value = true;
    if (!formValid.value) return;
    submitting.value = true;
    errorMessage.value = null;

    try {
        const created = await orpc.forms.create({
            query: { id: parentId.value != null ? String(parentId.value) : '' },
            body: {
                title: title.value.trim(),
                name: slug.value.trim(),
                description: description.value.trim() || null,
                created_by: null,
                updated_by: null,
            } as any,
        });
        const path = buildFormUrlPath(created as any);
        router.push(Routes.formsDetail(path));
    } catch (err: any) {
        const msg =
            err?.message ?? err?.data?.message ?? t('forms.new.createError');
        errorMessage.value = msg;
        notify(msg, 'danger');
    } finally {
        submitting.value = false;
    }
}

function cancel() {
    if (parentPath.value) {
        router.push(Routes.groupsDetail(parentPath.value));
    } else {
        router.push(Routes.FORMS);
    }
}
</script>

<template>
    <BasePage
        :title="t('forms.new.title')"
        :description="t('forms.new.subtitle')"
        icon="file-plus"
    >
        <BCard>
            <BCardBody>
                <BForm
                    class="d-flex flex-column gap-3"
                    novalidate
                    :validated="formTouched"
                    @submit.prevent="submit"
                >
                    <!-- Title -->
                    <BFormGroup
                        :label="t('forms.new.fields.title')"
                        label-class="fw-medium"
                        required
                    >
                        <BFormInput
                            v-model="title"
                            :placeholder="
                                t('forms.new.fields.titlePlaceholder')
                            "
                            :state="titleState()"
                            autofocus
                            :required="true"
                        />
                        <BFormInvalidFeedback :force-show="showTitleInvalid">
                            {{ t('common.required') }}
                        </BFormInvalidFeedback>
                    </BFormGroup>

                    <!-- Parent group (optional) -->
                    <BFormGroup
                        :label="t('forms.new.fields.parent')"
                        label-class="fw-medium"
                    >
                        <GroupTreeSelect
                            v-model="parentId"
                            :current-group-id="(parentGroup as any)?.id ?? null"
                        />
                        <BFormText>{{
                            t('forms.new.fields.parentHint')
                        }}</BFormText>
                    </BFormGroup>

                    <!-- URL Slug -->
                    <BFormGroup
                        :label="t('forms.new.fields.name')"
                        label-class="fw-medium"
                        required
                    >
                        <BFormInput
                            v-model="slug"
                            :placeholder="t('forms.new.fields.namePlaceholder')"
                            class="font-monospace"
                            :state="slugInvalid ? false : undefined"
                            :required="true"
                            @input="onSlugInput"
                        />
                        <BFormInvalidFeedback :force-show="slugInvalid">
                            <template v-if="showSlugEmptyError">
                                {{ t('common.required') }}
                            </template>
                            <template v-else-if="showSlugFormatError">
                                {{ slugError }}
                            </template>
                        </BFormInvalidFeedback>
                        <BFormText>{{
                            t('forms.new.fields.nameHint')
                        }}</BFormText>
                    </BFormGroup>

                    <!-- Description -->
                    <BFormGroup
                        :label="t('forms.new.fields.description')"
                        label-class="fw-medium"
                    >
                        <BFormTextarea
                            v-model="description"
                            :placeholder="
                                t('forms.new.fields.descriptionPlaceholder')
                            "
                            rows="3"
                        />
                    </BFormGroup>

                    <!-- Error -->
                    <BAlert
                        v-if="errorMessage"
                        variant="danger"
                        :dismissible="false"
                    >
                        {{ errorMessage }}
                    </BAlert>

                    <!-- Actions -->
                    <div class="d-flex justify-content-end gap-2 pt-2">
                        <BButton variant="outline-secondary" @click="cancel">
                            {{ t('common.cancel') }}
                        </BButton>
                        <BButton
                            type="submit"
                            variant="primary"
                            :disabled="submitting"
                        >
                            <BSpinner v-if="submitting" small class="me-1" />
                            {{ t('forms.new.create') }}
                        </BButton>
                    </div>
                </BForm>
            </BCardBody>
        </BCard>
    </BasePage>
</template>
