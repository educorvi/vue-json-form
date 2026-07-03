<script setup lang="ts">
/**
 * /groups/[slug]/edit — Edit an existing group.
 *
 * Pre-populates form with existing group data.
 * Shows read-only ID and path fields.
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

const groupId = computed(() => String(route.params.slug));

// ── Fetch existing group ────────────────────────────────────────────────────

const {
    data: group,
    pending: loading,
    error: loadError,
} = useLazyAsyncData(`group-edit-${groupId.value}`, () =>
    orpc.groups.get({ params: { id: groupId.value } })
);

// ── Form state ──────────────────────────────────────────────────────────────

const title = ref('');
const slug = ref('');
const description = ref('');

// Slug auto-generation (same pattern as new.vue)
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
    if (!slug.value) {
        slugManuallyCleared.value = true;
    } else {
        slugManuallyCleared.value = false;
    }
}

// Populate form when group data arrives
watch(
    group,
    (g) => {
        if (g) {
            title.value = (g as any).title ?? '';
            slug.value = (g as any).name ?? '';
            description.value = (g as any).description ?? '';

            // ── Breadcrumb ────────────────────────────────────────────
            const items: Array<{ label: string; route?: string }> = [
                { label: t('nav.groups'), route: '/groups' },
            ];
            const parentPath = (g as any).parent_path;
            if (parentPath) {
                const segments: string[] = [];
                for (const entry of parentPath) {
                    segments.push(entry.path_segment ?? entry.name);
                    items.push({
                        label: entry.name,
                        route: `/groups/${encodeGroupPath(segments.join('/'))}`,
                    });
                }
            }
            // The group itself
            items.push({
                label:
                    (g as any).title || (g as any).name || `#${(g as any).id}`,
                route: `/groups/${encodeGroupPath(
                    buildGroupUrlPath(parentPath ?? null, (g as any).name ?? '')
                )}`,
            });
            // Edit
            items.push({ label: t('groups.edit.title') });
            breadcrumbStore.set(items);
        }
    },
    { immediate: true }
);

onUnmounted(() => {
    breadcrumbStore.set([]);
});

// ── Computed path display ───────────────────────────────────────────────────

const groupPath = computed(() => {
    if (!group.value) return '';
    const segments: string[] = [];
    if ((group.value as any).parent_path) {
        for (const entry of (group.value as any).parent_path) {
            segments.push(entry.path_segment ?? entry.name);
        }
    }
    if ((group.value as any).name) {
        segments.push((group.value as any).name);
    }
    return '/' + segments.join('/');
});

// ── Submission ──────────────────────────────────────────────────────────────

const submitting = ref(false);
const errorMessage = ref<string | null>(null);

async function submit() {
    if (!title.value.trim()) return;
    submitting.value = true;
    errorMessage.value = null;

    try {
        await orpc.groups.update({
            params: { id: groupId.value },
            body: {
                title: title.value.trim() || undefined,
                name: slug.value.trim() || undefined,
                description: description.value.trim() || null,
            } as any,
        });
        // Navigate back to the group detail page
        await router.push(
            `/groups/${encodeGroupPath(
                buildGroupUrlPath(
                    (group.value as any)?.parent_path ?? null,
                    slug.value.trim() || (group.value as any)?.name || ''
                )
            )}`
        );
    } catch (err: any) {
        errorMessage.value =
            err?.message ?? err?.data?.message ?? t('groups.edit.updateError');
    } finally {
        submitting.value = false;
    }
}

function cancel() {
    if (group.value) {
        const path = buildGroupUrlPath(
            (group.value as any).parent_path,
            (group.value as any).name ?? ''
        );
        router.push(`/groups/${encodeGroupPath(path)}`);
    } else {
        router.push('/groups');
    }
}
</script>

<template>
    <BasePage
        :title="t('groups.edit.title')"
        :description="t('groups.edit.subtitle')"
    >
        <!-- Loading skeleton -->
        <BCard v-if="loading">
            <BCardBody>
                <div class="d-flex flex-column gap-3">
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
                    <BPlaceholder animation="glow" width="100%" height="5rem" />
                </div>
            </BCardBody>
        </BCard>

        <!-- Error -->
        <BAlert
            v-else-if="loadError"
            variant="danger"
            :dismissible="false"
            class="mb-4"
        >
            {{ (loadError as any)?.message }}
        </BAlert>

        <!-- Form -->
        <BCard v-else-if="group">
            <BCardBody>
                <BForm
                    class="d-flex flex-column gap-3"
                    @submit.prevent="submit"
                >
                    <!-- Read-only ID -->
                    <BFormGroup
                        label="ID"
                        label-class="fw-medium text-secondary"
                    >
                        <BFormInput
                            :model-value="(group as any).id"
                            disabled
                            class="opacity-50"
                        />
                    </BFormGroup>

                    <!-- Read-only Path -->
                    <BFormGroup
                        :label="t('groups.edit.fields.path')"
                        label-class="fw-medium text-secondary"
                    >
                        <BFormInput
                            :model-value="groupPath"
                            disabled
                            class="font-monospace opacity-50"
                        />
                    </BFormGroup>

                    <!-- Title -->
                    <BFormGroup
                        :label="t('groups.edit.fields.title')"
                        label-class="fw-medium"
                        required
                    >
                        <BFormInput
                            v-model="title"
                            :placeholder="
                                t('groups.edit.fields.titlePlaceholder')
                            "
                            autofocus
                            required
                        />
                    </BFormGroup>

                    <!-- Slug / Name -->
                    <BFormGroup
                        :label="t('groups.edit.fields.name')"
                        label-class="fw-medium"
                        required
                    >
                        <BFormInput
                            v-model="slug"
                            :placeholder="
                                t('groups.edit.fields.namePlaceholder')
                            "
                            class="font-monospace"
                            required
                            @input="onSlugInput"
                        />
                        <BFormText>
                            {{ t('groups.edit.fields.nameHint') }}
                        </BFormText>
                    </BFormGroup>

                    <!-- Description -->
                    <BFormGroup
                        :label="t('groups.edit.fields.description')"
                        label-class="fw-medium"
                    >
                        <BFormTextarea
                            v-model="description"
                            :placeholder="
                                t('groups.edit.fields.descriptionPlaceholder')
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
                            :disabled="
                                !title.trim() || !slug.trim() || submitting
                            "
                        >
                            <BSpinner v-if="submitting" small class="me-1" />
                            {{ t('groups.edit.save') }}
                        </BButton>
                    </div>
                </BForm>
            </BCardBody>
        </BCard>
    </BasePage>
</template>
