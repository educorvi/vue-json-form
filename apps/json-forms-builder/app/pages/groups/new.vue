<script setup lang="ts">
/**
 * /groups/new — Create a new group.
 *
 * - Title (required), name/slug (auto-derived, editable), description (optional)
 * - Parent group select via GroupParentSelect
 * - Query param `?parent=<id>` pre-selects the current folder
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

// ── Form state ───────────────────────────────────────────────────────────────

const title = ref('');
const slug = ref('');
const description = ref('');
const parentId = ref<number | null>(
    route.query.parent ? parseInt(String(route.query.parent), 10) : null
);

// ── Slug auto-generation ─────────────────────────────────────────────────────

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
                parentGroup.value = result as any;
            } catch {
                parentGroup.value = null;
            }
        } else {
            parentGroup.value = null;
        }
    },
    { immediate: true }
);

// ── Breadcrumb ───────────────────────────────────────────────────────────────

watch(
    parentGroup,
    (pg) => {
        const items: Array<{ label: string; route?: string }> = [
            { label: t('nav.groups'), route: '/groups' },
        ];
        if (pg) {
            const entries = (pg as any).parent_path;
            if (entries) {
                const segments: string[] = [];
                for (const entry of entries) {
                    segments.push(entry.path_segment ?? entry.name);
                    items.push({
                        label: entry.name,
                        route: `/groups/${encodeGroupPath(segments.join('/'))}`,
                    });
                }
            }
            items.push({
                label:
                    (pg as any).title ||
                    (pg as any).name ||
                    `#${(pg as any).id}`,
                route: `/groups/${encodeGroupPath(
                    buildGroupUrlPath(
                        (pg as any).parent_path ?? null,
                        (pg as any).name ?? ''
                    )
                )}`,
            });
        }
        items.push({ label: t('groups.new.title') });
        breadcrumbStore.set(items);
    },
    { immediate: true }
);

onUnmounted(() => {
    breadcrumbStore.set([]);
});

// ── Parent group picker ─────────────────────────────────────────────────────

const parentPickerOpen = ref(false);
const parentSearch = ref('');
const parentResults = ref<{ id: number; title?: string; name?: string }[]>([]);
const parentLoading = ref(false);

async function searchParentGroups(query: string) {
    parentLoading.value = true;
    try {
        const result = await orpc.groups.list({
            query: {
                page: 1,
                page_size: 20,
                search: query || undefined,
                sort_order: 'asc',
                order_by: 'title',
            },
        });
        parentResults.value = result.data as any[];
    } catch {
        parentResults.value = [];
    } finally {
        parentLoading.value = false;
    }
}

function selectParent(group: { id: number; title?: string; name?: string }) {
    parentId.value = group.id;
    parentGroup.value = group as any;
    parentPickerOpen.value = false;
    parentSearch.value = '';
}

function clearParent() {
    parentId.value = null;
    parentGroup.value = null;
}

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
    if (parentId.value != null) {
        if (parentGroup.value) {
            const path = buildGroupUrlPath(
                (parentGroup.value as any).parent_path ?? null,
                (parentGroup.value as any).name ?? ''
            );
            router.push(`/groups/${encodeGroupPath(path)}`);
        } else {
            router.push(`/groups/${parentId.value}`);
        }
    } else {
        router.push('/groups');
    }
}
</script>

<template>
    <BasePage
        :title="t('groups.new.title')"
        :description="t('groups.new.subtitle')"
    >
        <!-- Form card -->
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
                            autofocus
                            required
                        />
                    </BFormGroup>

                    <!-- Slug / Name -->
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
                            required
                            @input="onSlugInput"
                        />
                        <BFormText>
                            {{ t('groups.new.fields.nameHint') }}
                        </BFormText>
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

                    <!-- Parent group -->
                    <BFormGroup
                        :label="t('groups.new.fields.parent')"
                        label-class="fw-medium"
                    >
                        <div class="d-flex align-items-center gap-2">
                            <span v-if="parentGroup" class="text-body">
                                <PhosphorIcon
                                    name="folder"
                                    :size="16"
                                    class="text-warning me-1"
                                />
                                {{
                                    (parentGroup as any).title ||
                                    (parentGroup as any).name
                                }}
                            </span>
                            <span v-else class="text-secondary small">
                                {{ t('groups.new.fields.parentHint') }}
                            </span>
                            <BButton
                                v-if="parentGroup"
                                variant="link"
                                size="sm"
                                class="text-danger p-0"
                                @click="clearParent"
                            >
                                <PhosphorIcon name="x" :size="14" />
                            </BButton>
                        </div>

                        <BDropdown
                            v-model="parentPickerOpen"
                            text="Browse…"
                            size="sm"
                            variant="outline-secondary"
                            class="mt-1"
                        >
                            <div class="px-2 py-1" style="min-width: 280px">
                                <BFormInput
                                    v-model="parentSearch"
                                    size="sm"
                                    :placeholder="t('groups.searchPlaceholder')"
                                    @input="
                                        searchParentGroups($event.target.value)
                                    "
                                />
                            </div>
                            <BDropdownDivider />
                            <div
                                v-if="parentLoading"
                                class="px-3 py-2 text-center"
                            >
                                <BSpinner small />
                            </div>
                            <template v-else>
                                <BDropdownItem
                                    v-for="p in parentResults"
                                    :key="p.id"
                                    @click="selectParent(p)"
                                >
                                    <PhosphorIcon
                                        name="folder"
                                        :size="14"
                                        class="text-warning me-1"
                                    />
                                    {{ p.title || p.name }}
                                </BDropdownItem>
                                <BDropdownItem
                                    v-if="
                                        parentResults.length === 0 &&
                                        parentSearch
                                    "
                                    disabled
                                >
                                    {{
                                        t('groups.noSearchResults', {
                                            query: parentSearch,
                                        })
                                    }}
                                </BDropdownItem>
                            </template>
                        </BDropdown>

                        <BFormText>
                            {{ t('groups.new.fields.parentHint') }}
                        </BFormText>
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
                            {{ t('groups.new.create') }}
                        </BButton>
                    </div>
                </BForm>
            </BCardBody>
        </BCard>
    </BasePage>
</template>
