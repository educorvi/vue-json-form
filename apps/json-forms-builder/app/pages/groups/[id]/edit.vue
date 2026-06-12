<script setup lang="ts">
/**
 * /groups/{id}/edit — Edit an existing group.
 *
 * Allows updating:
 * - Title
 * - Description
 * - URL slug (name)
 *
 * Displays greyed-out:
 * - ID (read-only)
 * - Path (read-only, computed from parent_path + name)
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

definePageMeta({ middleware: ['authenticated'], layout: 'default' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const groupId = computed(() => String(route.params.id));

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
            title.value = g.title ?? '';
            slug.value = g.name ?? '';
            description.value = g.description ?? '';
        }
    },
    { immediate: true }
);

// ── Computed path display ───────────────────────────────────────────────────

const groupPath = computed(() => {
    if (!group.value) return '';
    const segments: string[] = [];
    if (group.value.parent_path) {
        for (const entry of group.value.parent_path) {
            segments.push(entry.path_segment ?? entry.name);
        }
    }
    if (group.value.name) {
        segments.push(group.value.name);
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    group.value?.parent_path ?? null,
                    slug.value.trim() || group.value?.name || ''
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
            group.value.parent_path,
            group.value.name ?? ''
        );
        router.push(`/groups/${encodeGroupPath(path)}`);
    } else {
        router.push('/groups');
    }
}

// ── Breadcrumb ──────────────────────────────────────────────────────────────

const breadcrumbItems = computed(() => {
    const items: { label: string; route?: string }[] = [
        { label: t('groups.title'), route: '/groups' },
    ];
    if (group.value?.parent_path) {
        const pathSegments: string[] = [];
        for (const entry of group.value.parent_path) {
            const seg = entry.path_segment ?? '';
            pathSegments.push(seg);
            items.push({
                label: entry.name,
                route: `/groups/${encodeGroupPath(pathSegments.join('/'))}`,
            });
        }
    }
    if (group.value) {
        const path = buildGroupUrlPath(
            group.value.parent_path,
            group.value.name ?? ''
        );
        items.push({
            label:
                group.value.title || group.value.name || `#${group.value.id}`,
            route: `/groups/${encodeGroupPath(path)}`,
        });
    }
    items.push({ label: t('groups.edit.title') });
    return items;
});
</script>

<template>
    <PageWrapper>
        <!-- Breadcrumb -->
        <Breadcrumb
            :home="{ icon: 'pi pi-home', route: '/dashboard' }"
            :model="breadcrumbItems"
            class="mb-4 px-0"
        >
            <template #item="{ item }">
                <NuxtLink
                    v-if="item.route"
                    :to="item.route"
                    class="no-underline text-surface-600 dark:text-surface-300 hover:underline text-sm"
                >
                    {{ item.label }}
                </NuxtLink>
                <span
                    v-else
                    class="text-sm font-medium text-surface-800 dark:text-surface-100"
                    >{{ item.label }}</span
                >
            </template>
        </Breadcrumb>

        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                {{ t('groups.edit.title') }}
            </h1>
            <p class="text-sm text-surface-400 mt-0.5">
                {{ t('groups.edit.subtitle') }}
            </p>
        </div>

        <!-- Loading skeleton -->
        <Card v-if="loading">
            <template #content>
                <div class="flex flex-col gap-4">
                    <Skeleton height="2rem" />
                    <Skeleton height="2rem" />
                    <Skeleton height="4rem" />
                    <Skeleton height="2rem" class="w-1/3" />
                </div>
            </template>
        </Card>

        <!-- Error -->
        <Message
            v-else-if="loadError"
            severity="error"
            :closable="false"
            class="mb-4"
        >
            {{ loadError.message }}
        </Message>

        <!-- Form -->
        <Card v-else-if="group">
            <template #content>
                <form class="flex flex-col gap-5" @submit.prevent="submit">
                    <!-- Read-only ID -->
                    <div class="flex flex-col gap-1">
                        <label
                            class="text-sm font-medium text-surface-500 dark:text-surface-400"
                        >
                            ID
                        </label>
                        <InputText
                            :value="group.id"
                            class="w-full opacity-60"
                            disabled
                        />
                    </div>

                    <!-- Read-only Path -->
                    <div class="flex flex-col gap-1">
                        <label
                            class="text-sm font-medium text-surface-500 dark:text-surface-400"
                        >
                            {{ t('groups.edit.fields.path') }}
                        </label>
                        <InputText
                            :value="groupPath"
                            class="w-full font-mono opacity-60"
                            disabled
                        />
                    </div>

                    <!-- Title -->
                    <div class="flex flex-col gap-1">
                        <label
                            for="edit-group-title"
                            class="text-sm font-medium text-surface-700 dark:text-surface-200"
                        >
                            {{ t('groups.edit.fields.title') }}
                            <span class="text-red-500 ml-0.5">*</span>
                        </label>
                        <InputText
                            id="edit-group-title"
                            v-model="title"
                            :placeholder="
                                t('groups.edit.fields.titlePlaceholder')
                            "
                            class="w-full"
                            autofocus
                            required
                        />
                    </div>

                    <!-- Slug / Name -->
                    <div class="flex flex-col gap-1">
                        <label
                            for="edit-group-slug"
                            class="text-sm font-medium text-surface-700 dark:text-surface-200"
                        >
                            {{ t('groups.edit.fields.name') }}
                            <span class="text-red-500 ml-0.5">*</span>
                        </label>
                        <InputText
                            id="edit-group-slug"
                            v-model="slug"
                            :placeholder="
                                t('groups.edit.fields.namePlaceholder')
                            "
                            class="w-full font-mono"
                            required
                            @input="onSlugInput"
                        />
                        <small class="text-surface-400">
                            {{ t('groups.edit.fields.nameHint') }}
                        </small>
                    </div>

                    <!-- Description -->
                    <div class="flex flex-col gap-1">
                        <label
                            for="edit-group-description"
                            class="text-sm font-medium text-surface-700 dark:text-surface-200"
                        >
                            {{ t('groups.edit.fields.description') }}
                        </label>
                        <Textarea
                            id="edit-group-description"
                            v-model="description"
                            :placeholder="
                                t('groups.edit.fields.descriptionPlaceholder')
                            "
                            rows="3"
                            class="w-full"
                            auto-resize
                        />
                    </div>

                    <!-- Error -->
                    <Message
                        v-if="errorMessage"
                        severity="error"
                        :closable="false"
                    >
                        {{ errorMessage }}
                    </Message>

                    <!-- Actions -->
                    <div class="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            :label="t('common.cancel')"
                            severity="secondary"
                            outlined
                            @click="cancel"
                        />
                        <Button
                            type="submit"
                            :label="t('groups.edit.save')"
                            icon="pi pi-check"
                            :loading="submitting"
                            :disabled="!title.trim() || !slug.trim()"
                        />
                    </div>
                </form>
            </template>
        </Card>
    </PageWrapper>
</template>
