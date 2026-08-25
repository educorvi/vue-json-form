<script setup lang="ts">
/**
 * /groups/new — Create a new group.
 *
 * Field order: Title → Parent Group → URL Slug → Description
 * Query param `?parent=<encoded-path>` pre-selects the parent.
 */
import type { Visibility } from '@/utils/api-types';
definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc;

// ── Parent group — fetch for breadcrumb ────────────────────────────────
const parentPath = ref<string | null>(
    route.query.parent ? decodeURIComponent(String(route.query.parent)) : null
);

const { set: setBreadcrumb } = useAppBreadcrumb();

const { data: parentGroup } = useAsyncData(
    () => `parent-group-for-subgroup-${parentPath.value}`,
    () =>
        parentPath.value
            ? orpc.groups.get({ params: { id: parentPath.value } })
            : Promise.resolve(null),
    {
        watch: [parentPath],
        immediate: true,
        transform: (raw: any): any => {
            setBreadcrumb('groups', raw, t('groups.new.title'));
            return raw;
        },
    }
);

// ── Form state ─────────────────────────────────────────────────────────────
const title = ref('');
const slug = ref('');
const description = ref('');
const parentId = ref<number | null>(null);

// ── Visibility ─────────────────────────────────────────────────────────────
const visibility = ref<Visibility>('visible');

/** Children of a private parent are always private. */
const parentIsPrivate = computed(
    () => parentGroup.value?.visibility === 'private'
);
const effectiveVisibility = computed<Visibility>(
    () => (parentIsPrivate.value ? 'private' : visibility.value)
);

// ── Sync parent ID from fetched parent group ────────────────────────────
watch(
    parentGroup,
    (g) => {
        if (g && parentId.value === null) {
            parentId.value = g.id;
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
    if (!SLUG_RE.test(slug.value)) return t('groups.new.fields.slugInvalid');
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
        const created = await orpc.groups.create({
            query:
                parentPath.value != null
                    ? { parent: parentPath.value }
                    : undefined,
            body: {
                title: title.value.trim(),
                name: slug.value.trim(),
                description: description.value.trim() || undefined,
                visibility: effectiveVisibility.value,
            },
        });
        notify(t('groups.new.createSuccess'), 'success');
        const path = buildGroupUrlPath(
            created.parent_path ?? null,
            created.name ?? ''
        );
        await router.push(Routes.groupsDetail(path));
    } catch (err: any) {
        const msg =
            err?.message ?? err?.data?.message ?? t('groups.new.createError');
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
        router.push(Routes.GROUPS);
    }
}
</script>

<template>
    <BasePage
        icon="ph:folder-plus"
        :title="t('groups.new.title')"
        :description="t('groups.new.subtitle')"
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
                        :label="t('groups.new.fields.title')"
                        label-class="fw-medium"
                        required
                    >
                        <BFormInput
                            v-model="title"
                            :placeholder="
                                t('groups.new.fields.titlePlaceholder')
                            "
                            :state="titleState()"
                            autofocus
                            :required="true"
                        />
                        <BFormInvalidFeedback :force-show="showTitleInvalid">
                            {{ t('common.required') }}
                        </BFormInvalidFeedback>
                    </BFormGroup>

                    <!-- Parent group -->
                    <BFormGroup
                        :label="t('groups.new.fields.parent')"
                        label-class="fw-medium"
                    >
                        <GroupTreeSelect
                            v-model="parentId"
                            :current-group-id="parentGroup?.id ?? null"
                        />
                        <BFormText>{{
                            t('groups.new.fields.parentHint')
                        }}</BFormText>
                    </BFormGroup>

                    <!-- URL Slug -->
                    <BFormGroup
                        :label="t('groups.new.fields.name')"
                        label-class="fw-medium"
                        required
                    >
                        <BFormInput
                            v-model="slug"
                            :placeholder="
                                t('groups.new.fields.namePlaceholder')
                            "
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
                            t('groups.new.fields.nameHint')
                        }}</BFormText>
                    </BFormGroup>

                    <!-- Description -->
                    <BFormGroup
                        :label="t('groups.new.fields.description')"
                        label-class="fw-medium"
                    >
                        <BFormTextarea
                            v-model="description"
                            :placeholder="
                                t('groups.new.fields.descriptionPlaceholder')
                            "
                            rows="3"
                        />
                    </BFormGroup>

                    <!-- Visibility -->
                    <BFormGroup
                        :label="t('visibility.label')"
                        label-class="fw-medium"
                    >
                        <BFormSelect
                            :model-value="effectiveVisibility"
                            :disabled="parentIsPrivate"
                            @update:model-value="
                                visibility = String($event ?? 'visible') as
                                    Visibility
                            "
                        >
                            <option value="visible">
                                {{ t('visibility.visible') }}
                            </option>
                            <option value="private">
                                {{ t('visibility.private') }}
                            </option>
                        </BFormSelect>
                        <BFormText
                            v-if="parentIsPrivate"
                            class="text-warning"
                        >
                            <Icon name="ph:lock" :size="14" class="me-1" />
                            {{ t('visibility.parentPrivate') }}
                        </BFormText>
                        <BFormText v-else-if="visibility === 'visible'">
                            {{ t('visibility.visibleDescription') }}
                        </BFormText>
                        <BFormText v-else>
                            {{ t('visibility.privateDescription') }}
                        </BFormText>
                    </BFormGroup>

                    <!-- Error -->
                    <BAlert
                        v-if="errorMessage"
                        show
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
                            {{ t('groups.new.create') }}
                        </BButton>
                    </div>
                </BForm>
            </BCardBody>
        </BCard>
    </BasePage>
</template>
