<script setup lang="ts">
/**
 * /groups/new — Create a new group.
 *
 * - Title (required), name/slug (auto-derived, editable), description (optional)
 * - Parent group: chosen via GroupTreeSelect
 *   - Query param `?parent=<id>` pre-selects the current folder
 *   - "Use current folder" button inside GroupTreeSelect to re-select
 */
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

definePageMeta({ middleware: ['authenticated'], layout: 'default' });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

// ── Form state ───────────────────────────────────────────────────────────────

const title = ref('');
const slug = ref('');
const description = ref('');
const parentId = ref<number | null>(
    route.query.parent ? parseInt(String(route.query.parent), 10) : null
);

// ── Slug auto-generation ─────────────────────────────────────────────────────
// Uses the centralised toSlug() helper.
// - When the user hasn't touched the slug field, auto-generate from title.
// - When the user types in the slug field, stop auto-generating.
// - When the user clears the slug field AND changes the title, restart.

const slugEditedByUser = ref(false);
const slugManuallyCleared = ref(false);

watch(title, (val) => {
    if (!slugEditedByUser.value) {
        // Never edited → always auto-generate
        slug.value = toSlug(val);
    } else if (slugManuallyCleared.value && !slug.value) {
        // Was cleared by user and title changed → restart auto-generation
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

// ── Fetch parent group for breadcrumb ───────────────────────────────────────

const parentGroup = ref<{
    id: number;
    title?: string;
    name?: string;
    parent_path?: Array<{
        id?: number;
        name: string;
        path_segment?: string;
    }> | null;
} | null>(null);

watch(
    parentId,
    async (id) => {
        if (id != null) {
            try {
                const result = await orpc.groups.get({
                    params: { id: String(id) },
                });
                parentGroup.value = result;
            } catch {
                parentGroup.value = null;
            }
        } else {
            parentGroup.value = null;
        }
    },
    { immediate: true }
);

// ── Submission ───────────────────────────────────────────────────────────────

const submitting = ref(false);
const errorMessage = ref<string | null>(null);

async function submit() {
    if (!title.value.trim()) return;
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
        // Navigate to the newly created group's page using its path
        const path = buildGroupUrlPath(created.parent_path, created.name ?? '');
        await router.push(`/groups/${encodeGroupPath(path)}`);
    } catch (err: any) {
        errorMessage.value =
            err?.message ?? err?.data?.message ?? t('groups.new.createError');
    } finally {
        submitting.value = false;
    }
}

function cancel() {
    if (parentGroup.value) {
        const path = buildGroupUrlPath(
            parentGroup.value.parent_path ?? null,
            parentGroup.value.name ?? ''
        );
        router.push(`/groups/${encodeGroupPath(path)}`);
    } else if (parentId.value != null) {
        router.push(`/groups/${parentId.value}`);
    } else {
        router.push('/groups');
    }
}

// ── Breadcrumb ───────────────────────────────────────────────────────────────

const breadcrumbItems = computed(() => [
    { label: t('groups.title'), route: '/groups' },
    ...(parentGroup.value
        ? [
              {
                  label:
                      parentGroup.value.title || parentGroup.value.name || '',
                  route: `/groups/${encodeGroupPath(
                      buildGroupUrlPath(
                          parentGroup.value.parent_path ?? null,
                          parentGroup.value.name ?? ''
                      )
                  )}`,
              },
          ]
        : []),
    { label: t('groups.new.title') },
]);
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
                {{ t('groups.new.title') }}
            </h1>
            <p class="text-sm text-surface-400 mt-0.5">
                {{ t('groups.new.subtitle') }}
            </p>
        </div>

        <!-- Form card -->
        <Card>
            <template #content>
                <form class="flex flex-col gap-5" @submit.prevent="submit">
                    <!-- Title -->
                    <div class="flex flex-col gap-1">
                        <label
                            for="group-title"
                            class="text-sm font-medium text-surface-700 dark:text-surface-200"
                        >
                            {{ t('groups.new.fields.title') }}
                            <span class="text-red-500 ml-0.5">*</span>
                        </label>
                        <InputText
                            id="group-title"
                            v-model="title"
                            :placeholder="
                                t('groups.new.fields.titlePlaceholder')
                            "
                            class="w-full"
                            autofocus
                            required
                        />
                    </div>

                    <!-- Slug / Name -->
                    <div class="flex flex-col gap-1">
                        <label
                            for="group-slug"
                            class="text-sm font-medium text-surface-700 dark:text-surface-200"
                        >
                            {{ t('groups.new.fields.name') }}
                            <span class="text-red-500 ml-0.5">*</span>
                        </label>
                        <InputText
                            id="group-slug"
                            v-model="slug"
                            :placeholder="
                                t('groups.new.fields.namePlaceholder')
                            "
                            class="w-full font-mono"
                            required
                            @input="onSlugInput"
                        />
                        <small class="text-surface-400">
                            {{ t('groups.new.fields.nameHint') }}
                        </small>
                    </div>

                    <!-- Description -->
                    <div class="flex flex-col gap-1">
                        <label
                            for="group-description"
                            class="text-sm font-medium text-surface-700 dark:text-surface-200"
                        >
                            {{ t('groups.new.fields.description') }}
                        </label>
                        <Textarea
                            id="group-description"
                            v-model="description"
                            :placeholder="
                                t('groups.new.fields.descriptionPlaceholder')
                            "
                            rows="3"
                            class="w-full"
                            auto-resize
                        />
                    </div>

                    <!-- Parent group -->
                    <div class="flex flex-col gap-1">
                        <label
                            class="text-sm font-medium text-surface-700 dark:text-surface-200"
                        >
                            {{ t('groups.new.fields.parent') }}
                        </label>
                        <GroupTreeSelect
                            v-model="parentId"
                            :current-group-id="
                                route.query.parent
                                    ? parseInt(String(route.query.parent), 10)
                                    : null
                            "
                        />
                        <small class="text-surface-400">
                            {{ t('groups.new.fields.parentHint') }}
                        </small>
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
                            :label="t('groups.new.create')"
                            icon="pi pi-plus"
                            :loading="submitting"
                            :disabled="!title.trim() || !slug.trim()"
                        />
                    </div>
                </form>
            </template>
        </Card>
    </PageWrapper>
</template>
