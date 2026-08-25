<script setup lang="ts">
/**
 * /groups/detail?path=<path> — Group detail (stats + children tree).
 * Path is the URL-encoded group path (e.g. "educorvi%2Fonboarding").
 */

import ConfirmTypingDelete from '@/components/utils/ConfirmTypingDelete.vue';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const { notify } = useNotify();
const route = useRoute();
const router = useRouter();
const orpc = useNuxtApp().$orpc;

const groupPath = computed(() => decodedPathQuery(route.query));

const { set: setBreadcrumb } = useAppBreadcrumb();

const {
    data: group,
    error: groupError,
    status,
} = useAsyncData(
    () => `group-detail-${groupPath.value}`,
    () => orpc.groups.get({ params: { id: groupPath.value } }),
    {
        watch: [groupPath],
        transform: (raw: any) => {
            if (raw) setBreadcrumb('groups', raw);
            return raw;
        },
    }
);
const pending = computed(() => status.value === 'pending');

const { isNotFound, hasError, errorMessage } = usePageError(groupError, status);

// ── Access control (RBAC) ───────────────────────────────────────────────────
// Determines which actions are available to the current user on this group:
// editing requires at least `editor`, creating child items requires `owner`.
// The effective role comes server-side with the group payload
// (`effective_role`) — SSR renders the final button state immediately.
const access = useResourceAccess(group);

const ownerRoleLabel = computed(() => t('permissions.roles.owner'));
const editorRoleLabel = computed(() => t('permissions.roles.editor'));
const needOwnerHint = computed(() =>
    t('permissions.needRoleHint', { role: ownerRoleLabel.value })
);
const needEditorHint = computed(() =>
    t('permissions.needRoleHint', { role: editorRoleLabel.value })
);

const childPage = ref(1);
const childPageSize = ref(20);
const childSearch = ref('');
const childSortOrder = ref<'asc' | 'desc'>('asc');
const childOrderBy = ref<'title' | 'created' | 'updated'>('title');
const sortOptions = [
    { label: t('groups.sortBy.title'), value: 'title' as const },
    { label: t('groups.sortBy.created'), value: 'created' as const },
    { label: t('groups.sortBy.updated'), value: 'updated' as const },
];

const {
    data: children,
    pending: childrenPending,
    error: childrenError,
} = useAsyncData(
    () => `group-children-${groupPath.value}`,
    () =>
        orpc.groups.listChildren({
            params: { id: groupPath.value },
            query: {
                page: childPage.value,
                page_size: childPageSize.value,
                search: childSearch.value || undefined,
                sort_order: childSortOrder.value,
                order_by: childOrderBy.value,
            },
        }),
    {
        watch: [
            childPage,
            childPageSize,
            childSearch,
            childSortOrder,
            childOrderBy,
        ],
    }
);

function onChildSearchChange(val: string) {
    childSearch.value = val;
    childPage.value = 1;
}

const deleteTarget = ref<any>(null);
const showDeleteModal = ref(false);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

function onDelete(item: any) {
    deleteTarget.value = item;
    showDeleteModal.value = true;
    deleteError.value = null;
}

async function onDeleteConfirm(item: any) {
    deletePending.value = true;
    deleteError.value = null;
    try {
        if (item.type === 'form') {
            await orpc.forms.delete({ params: { id: String(item.id) } });
        } else {
            await orpc.groups.delete({ params: { id: String(item.id) } });
        }
        showDeleteModal.value = false;
        deleteTarget.value = null;
        notify(t('groups.delete.deleteSuccess'), 'success');
        refreshNuxtData(`group-children-${groupPath.value}`);
        refreshNuxtData(`group-detail-${groupPath.value}`);
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        deleteError.value = msg;
        notify(msg, 'danger');
    } finally {
        deletePending.value = false;
    }
}

function onEditItem(item: any) {
    if (item.type === 'form') {
        const path = buildFormUrlPath(item);
        router.push(Routes.formsEdit(path));
    } else {
        const path = buildGroupUrlPath(
            item.parent_path,
            item.name ?? String(item.id)
        );
        router.push(Routes.groupsEdit(path));
    }
}

function onNavigateItem(item: any) {
    if (item.type === 'form') {
        const path = buildFormUrlPath(item);
        router.push(Routes.formsDetail(path));
    } else {
        const path = buildGroupUrlPath(
            item.parent_path,
            item.name ?? String(item.id)
        );
        router.push(Routes.groupsDetail(path));
    }
}

function editCurrent() {
    router.push(Routes.groupsEdit(groupPath.value));
}
</script>

<template>
    <BasePage
        :title="group?.title || group?.name || '...'"
        :description="group?.description ?? undefined"
        icon="ph:folder"
    >
        <template v-if="group" #actions>
            <BButton
                v-b-tooltip="needEditorHint"
                variant="outline-secondary"
                size="sm"
                :disabled="!access.canUpdate.value"
                data-testid="group-edit-button"
                class="me-2"
                @click="editCurrent"
            >
                <Icon name="ph:pencil" :size="14" class="me-1" />{{
                    t('common.edit')
                }}
            </BButton>
            <BButton
                variant="outline-primary"
                v-b-tooltip="needOwnerHint"
                size="sm"
                :to="Routes.formsNew(groupPath)"
                class="me-2"
                :disabled="!access.canCreateChild.value"
                data-testid="group-create-form-button"
            >
                <Icon name="ph:file-plus" :size="14" class="me-1" />{{
                    t('forms.new.title')
                }}
            </BButton>
            <BButton
                v-b-tooltip="needOwnerHint"
                variant="primary"
                size="sm"
                :to="Routes.groupsNew(groupPath)"
                :disabled="!access.canCreateChild.value"
                data-testid="group-create-group-button"
            >
                <Icon name="ph:plus" :size="14" class="me-1" />{{
                    t('groups.new.addSubGroup')
                }}
            </BButton>
        </template>

        <template v-if="hasError">
            <BaseErrorState
                v-if="isNotFound"
                icon="ph:warning-circle"
                :title="t('groups.notFound')"
                :description="errorMessage"
                :action-route="Routes.GROUPS"
                :action-label="t('groups.backToGroups')"
            />
            <BaseErrorState
                v-else
                icon="ph:bug"
                :title="t('common.errorTitle')"
                :description="errorMessage"
                :action-route="Routes.GROUPS"
                :action-label="t('groups.backToGroups')"
            />
        </template>

        <div v-else-if="pending" class="mb-4">
            <BPlaceholder animation="glow" class="mb-2" width="50%" />
            <BPlaceholder animation="glow" width="30%" />
        </div>

        <!-- Group detail -->
        <template v-if="group">
            <GroupDetailStats :childGroup="group" class="mb-2" />

            <ListToolbar
                v-model:search="childSearch"
                v-model:order-by="childOrderBy"
                v-model:sort-order="childSortOrder"
                :sort-options="sortOptions"
                :search-placeholder="t('groups.searchChildrenPlaceholder')"
                class="mb-3"
                @update:search="onChildSearchChange"
            />

            <ListDataContainer
                v-slot="{
                    items: stableChildren,
                    showSkeleton,
                    isEmpty: childrenEmpty,
                    hasError,
                    errorMessage,
                }"
                :items="children?.data ?? []"
                :pending="childrenPending"
                :error="childrenError ?? null"
            >
                <BAlert
                    v-if="hasError"
                    show
                    variant="danger"
                    :dismissible="false"
                    class="mb-3"
                >
                    <div class="d-flex align-items-center gap-2">
                        <Icon name="ph:warning-circle" /><strong>{{
                            t('groups.loadError')
                        }}</strong>
                    </div>
                    <p class="mb-0 mt-1">{{ errorMessage }}</p>
                </BAlert>

                <BCard v-else>
                    <BCardBody class="p-0">
                        <BPlaceholderTable
                            v-if="showSkeleton"
                            :columns="1"
                            :rows="5"
                            animation="glow"
                        >
                            <template #thead
                                ><BTr
                                    ><BTh>{{
                                        t('groups.columns.group')
                                    }}</BTh></BTr
                                ></template
                            >
                        </BPlaceholderTable>

                        <div v-else-if="childrenEmpty" class="p-4">
                            <EmptyState
                                icon="ph:folder-open"
                                :title="t('groups.noChildrenTitle')"
                                :description="
                                    childSearch
                                        ? t('groups.noSearchResults', {
                                              query: childSearch,
                                          })
                                        : t('groups.noChildrenDescription')
                                "
                            />
                        </div>

                        <GroupTreeTable
                            v-else
                            :items="stableChildren"
                            @edit="(item) => onEditItem(item)"
                            @delete="(item) => onDelete(item)"
                            @navigate="(item) => onNavigateItem(item)"
                        />
                    </BCardBody>

                    <div
                        v-if="!showSkeleton && !childrenEmpty && children"
                        class="px-3 pb-3 pt-2"
                    >
                        <ListPaginator
                            :current-page="childPage"
                            :page-size="childPageSize"
                            :total-count="children.total_count"
                            @update:current-page="
                                (v: number) => (childPage = v)
                            "
                            @update:page-size="
                                (v: number) => (childPageSize = v)
                            "
                        />
                    </div>
                </BCard>
            </ListDataContainer>
        </template>

        <!-- Delete modal for child items -->
        <ConfirmTypingDelete
            v-if="deleteTarget"
            v-model="showDeleteModal"
            :title="
                deleteTarget?.type === 'form'
                    ? t('forms.delete.title')
                    : t('groups.delete.title')
            "
            :warning="
                deleteTarget?.type === 'form'
                    ? t('forms.delete.warning')
                    : t('groups.delete.warning')
            "
            :item-name="deleteTarget?.title ?? deleteTarget?.name ?? ''"
            :confirm-label="
                deleteTarget?.type === 'form'
                    ? t('forms.delete.confirm')
                    : t('groups.delete.confirm')
            "
            :cancel-label="t('common.cancel')"
            :pending="deletePending"
            :error="deleteError"
            @confirm="onDeleteConfirm(deleteTarget!)"
        />
    </BasePage>
</template>
