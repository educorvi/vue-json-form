<script setup lang="ts">
/**
 * /groups/new — Create a new group.
 *
 * Field order: Title → Parent Group → URL Slug → Description
 * Query param `?parent=<id>` pre-selects the parent.
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import { useBreadcrumbStore } from '~~/app/store/breadcrumb';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;
const breadcrumbStore = useBreadcrumbStore();

// ── Breadcrumb ─────────────────────────────────────────────────────────────
breadcrumbStore.set([
    { label: t('nav.groups'), route: '/groups' },
    { label: t('groups.new.title') },
]);

// ── Form state ─────────────────────────────────────────────────────────────
const title = ref('');
const slug = ref('');
const description = ref('');
const parentId = ref<number | null>(
    route.query.parent ? parseInt(String(route.query.parent), 10) : null
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
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugError = computed(() => {
    if (!slug.value.trim()) return null;
    if (!SLUG_RE.test(slug.value)) return t('groups.new.fields.slugInvalid');
    return null;
});

const formTouched = ref(false);
const formValid = computed(
    () =>
        title.value.trim().length > 0 &&
        slug.value.trim().length > 0 &&
        SLUG_RE.test(slug.value)
);

// ── Submission ─────────────────────────────────────────────────────────────
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

async function submit() {
    formTouched.value = true;
    if (!formValid.value) return;
    submitting.value = true;
    errorMessage.value = null;

    try {
        const created = await orpc.groups.create({
            query:
                parentId.value != null
                    ? { parent: String(parentId.value) }
                    : undefined,
            body: {
                title: title.value.trim(),
                name: slug.value.trim(),
                description: description.value.trim() || undefined,
                created_by: null,
                updated_by: null,
            },
        });
        const path = buildGroupUrlPath(
            (created as any).parent_path,
            (created as any).name ?? ''
        );
        await router.push(`/groups/${encodeGroupPath(path)}`);
    } catch (err: any) {
        errorMessage.value =
            err?.message ?? err?.data?.message ?? t('groups.new.createError');
    } finally {
        submitting.value = false;
    }
}

function cancel() {
    router.push('/groups');
}
</script>

<template>
    <BasePage
        icon="folder-plus"
        :title="t('groups.new.title')"
        :description="t('groups.new.subtitle')"
    >
        <BCard>
            <BCardBody>
                <BForm
                    class="d-flex flex-column gap-3"
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
                            :state="formTouched && !title.trim() ? false : null"
                            autofocus
                            required
                        />
                        <div
                            v-if="formTouched && !title.trim()"
                            class="invalid-feedback"
                        >
                            {{ t('common.required') }}
                        </div>
                    </BFormGroup>

                    <!-- Parent group -->
                    <BFormGroup
                        :label="t('groups.new.fields.parent')"
                        label-class="fw-medium"
                    >
                        <GroupTreeSelect
                            v-model="parentId"
                            :current-group-id="
                                route.query.parent
                                    ? parseInt(String(route.query.parent), 10)
                                    : null
                            "
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
                            :state="formTouched && slugError ? false : null"
                            required
                            @input="onSlugInput"
                        />
                        <div
                            v-if="formTouched && slugError"
                            class="invalid-feedback"
                        >
                            {{ slugError }}
                        </div>
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
                            :disabled="!formValid || submitting"
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
