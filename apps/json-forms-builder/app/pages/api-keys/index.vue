<script setup lang="ts">
/**
 * /api-keys — API key management for the authenticated user.
 *
 * Lists the current user's own API keys with search, sort and client-side
 * pagination (the API returns all keys of a user without server-side
 * paging). Create, edit and delete are handled via modals; the full token
 * is only shown once directly after creation.
 */
import type { z } from 'zod';
import type { zApiKey } from '~~/server/orpc/generated/zod.gen';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import TimestampStats from '~/components/utils/TimestampStats.vue';
import ConfirmTypingDelete from '@/components/utils/ConfirmTypingDelete.vue';
import ApiKeyCreateModal from '~/components/api-key/ApiKeyCreateModal.vue';
import ApiKeyEditModal from '~/components/api-key/ApiKeyEditModal.vue';

type ApiKeyRow = z.infer<typeof zApiKey>;
type OrderBy = 'name' | 'created' | 'updated' | 'expires_at';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t, locale } = useI18n();
const { notify } = useNotify();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

useAppBreadcrumb().set('apiKeys');

// ── Data ───────────────────────────────────────────────────────────────────
const { data, pending, error, refresh } = useAsyncData(
    'api-keys',
    () => orpc.apiKeys.list(),
    { default: () => [] }
);

// ── Query state (client-side — the API returns all keys) ─────────────────
const page = ref(1);
const pageSize = ref(20);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('desc');
const orderBy = ref<OrderBy>('created');

const sortOptions: { label: string; value: OrderBy }[] = [
    { label: t('apiKeys.sortBy.name'), value: 'name' },
    { label: t('apiKeys.sortBy.created'), value: 'created' },
    { label: t('apiKeys.sortBy.updated'), value: 'updated' },
    { label: t('apiKeys.sortBy.expires'), value: 'expires_at' },
];

function onSearchChange() {
    page.value = 1;
}

// ── Filtering + sorting ────────────────────────────────────────────────────
const filteredKeys = computed<ApiKeyRow[]>(() => {
    const items = data.value ?? [];
    const q = search.value.trim().toLowerCase();

    let out = q
        ? items.filter((key) =>
              [key.name, key.description ?? '', key.identifier ?? '']
                  .join(' ')
                  .toLowerCase()
                  .includes(q)
          )
        : [...items];

    const dir = sortOrder.value === 'asc' ? 1 : -1;
    out.sort((a, b) => {
        let cmp = 0;
        switch (orderBy.value) {
            case 'name':
                cmp = a.name.localeCompare(b.name);
                break;
            case 'created':
                cmp = a.created.localeCompare(b.created);
                break;
            case 'updated':
                cmp = a.updated.localeCompare(b.updated);
                break;
            case 'expires_at':
                cmp = (a.expires_at ?? '').localeCompare(b.expires_at ?? '');
                break;
        }
        return cmp * dir;
    });
    return out;
});

const totalCount = computed(() => filteredKeys.value.length);

const pageItems = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return filteredKeys.value.slice(start, start + pageSize.value);
});

watch([search, orderBy, sortOrder], () => {
    page.value = 1;
});

// ── Expiry helpers ─────────────────────────────────────────────────────────
// Matches the backend semantics (ApiKeyService.validateToken):
// expired once the current time has passed the expiry date (midnight UTC).
function isExpired(key: ApiKeyRow): boolean {
    return !!key.expires_at && new Date(key.expires_at) < new Date();
}

function expiresText(key: ApiKeyRow): string {
    if (!key.expires_at) return t('apiKeys.never');
    return formatDate(key.expires_at, false, locale.value);
}

// ── Create / edit / delete ─────────────────────────────────────────────────
const showCreateModal = ref(false);
const editTarget = ref<ApiKeyRow | null>(null);
const showEditModal = ref(false);
const deleteTarget = ref<ApiKeyRow | null>(null);
const showDeleteModal = ref(false);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

function onCreated() {
    refresh();
}

function onEdit(key: ApiKeyRow) {
    editTarget.value = key;
    showEditModal.value = true;
}

function onSaved() {
    refresh();
}

function onDelete(key: ApiKeyRow) {
    deleteTarget.value = key;
    showDeleteModal.value = true;
    deleteError.value = null;
}

async function onDeleteConfirm(key: ApiKeyRow) {
    deletePending.value = true;
    deleteError.value = null;
    try {
        await orpc.apiKeys.delete({ params: { id: key.id } });
        showDeleteModal.value = false;
        deleteTarget.value = null;
        notify(t('apiKeys.delete.deleteSuccess'), 'success');
        refresh();
    } catch (err: any) {
        const msg =
            err?.message ??
            err?.data?.message ??
            t('apiKeys.delete.deleteError');
        deleteError.value = msg;
        notify(msg, 'danger');
    } finally {
        deletePending.value = false;
    }
}

const pageDescription = computed(() =>
    t('apiKeys.total', { n: totalCount.value }, totalCount.value)
);
</script>

<template>
    <BasePage
        :title="t('apiKeys.title')"
        :description="pageDescription"
        icon="ph:key"
    >
        <template #actions>
            <BButton
                variant="primary"
                size="sm"
                data-testid="new-api-key-button"
                @click="showCreateModal = true"
            >
                <Icon name="ph:plus" class="me-1" />
                {{ t('apiKeys.new.title') }}
            </BButton>
        </template>

        <ListToolbar
            v-model:search="search"
            v-model:order-by="orderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            :search-placeholder="t('apiKeys.searchPlaceholder')"
            class="mb-3"
            @update:search="onSearchChange"
        />

        <ListDataContainer
            :items="pageItems"
            :pending="pending"
            :error="error ?? null"
            v-slot="{
                items: stableItems,
                showSkeleton,
                isEmpty,
                hasError,
                errorMessage,
            }"
        >
            <!-- Error -->
            <BAlert
                v-if="hasError"
                show
                variant="danger"
                :dismissible="false"
                class="mb-3"
            >
                <div class="d-flex align-items-center gap-2">
                    <Icon name="ph:warning-circle" />
                    <strong>{{ t('apiKeys.loadError') }}</strong>
                </div>
                <p class="mb-0 mt-1">{{ errorMessage }}</p>
            </BAlert>

            <BCard v-else>
                <BCardBody class="p-0">
                    <BPlaceholderTable
                        v-if="showSkeleton"
                        :columns="4"
                        :rows="3"
                        animation="glow"
                    >
                        <template #thead>
                            <BTr>
                                <BTh>{{ t('apiKeys.columns.name') }}</BTh>
                                <BTh>{{ t('apiKeys.columns.identifier') }}</BTh>
                                <BTh>{{ t('apiKeys.columns.expires') }}</BTh>
                                <BTh>{{ t('apiKeys.columns.activity') }}</BTh>
                            </BTr>
                        </template>
                    </BPlaceholderTable>

                    <!-- Empty -->
                    <div v-else-if="isEmpty" class="p-4">
                        <EmptyState
                            icon="ph:key"
                            :title="t('apiKeys.noKeysTitle')"
                            :description="
                                search
                                    ? t('apiKeys.noSearchResults', {
                                          query: search,
                                      })
                                    : t('apiKeys.noKeysDescription')
                            "
                        />
                    </div>

                    <!-- Real data -->
                    <template v-else>
                        <div
                            v-for="key in stableItems"
                            :key="key.id"
                            class="d-flex align-items-center gap-2 py-2 px-3 border-bottom api-key-row"
                            data-testid="api-key-row"
                        >
                            <!-- Name + description + identifier -->
                            <div class="flex-grow-1 min-w-0">
                                <div class="d-flex align-items-center gap-2">
                                    <span class="fw-bold text-body">
                                        {{ key.name }}
                                    </span>
                                    <span
                                        v-if="key.identifier"
                                        class="font-monospace small text-secondary"
                                        :title="t('apiKeys.columns.identifier')"
                                    >
                                        {{ key.identifier }}
                                    </span>
                                </div>
                                <div
                                    v-if="key.description"
                                    class="text-secondary small text-truncate"
                                >
                                    {{ key.description }}
                                </div>
                            </div>

                            <!-- Expiry -->
                            <div class="flex-shrink-0">
                                <BBadge v-if="isExpired(key)" variant="danger">
                                    <Icon name="ph:warning" :size="12" />
                                    {{ t('apiKeys.expired') }}
                                </BBadge>
                                <span
                                    v-else
                                    class="small text-secondary text-nowrap"
                                >
                                    {{ expiresText(key) }}
                                </span>
                            </div>

                            <!-- Timestamps + actions -->
                            <div
                                class="d-flex align-items-center gap-2 flex-shrink-0"
                            >
                                <TimestampStats
                                    :created="key.created"
                                    :updated="key.updated"
                                />

                                <BDropdown
                                    variant="link"
                                    no-caret
                                    toggle-class="text-secondary p-0 border-0"
                                >
                                    <template #button-content>
                                        <Icon name="ph:dots-three" :size="18" />
                                    </template>
                                    <BDropdownItem @click="onEdit(key)">
                                        <Icon name="ph:pencil" />
                                        {{ t('common.edit') }}
                                    </BDropdownItem>
                                    <BDropdownItem @click="onDelete(key)">
                                        <Icon name="ph:trash" />
                                        {{ t('apiKeys.delete.title') }}
                                    </BDropdownItem>
                                </BDropdown>
                            </div>
                        </div>
                    </template>
                </BCardBody>

                <!-- Paginator -->
                <div v-if="!showSkeleton && !isEmpty" class="px-3 pb-3 pt-2">
                    <ListPaginator
                        :current-page="page"
                        :page-size="pageSize"
                        :total-count="totalCount"
                        @update:current-page="(v: number) => (page = v)"
                        @update:page-size="(v: number) => (pageSize = v)"
                    />
                </div>
            </BCard>
        </ListDataContainer>

        <!-- Create modal -->
        <ApiKeyCreateModal v-model="showCreateModal" @created="onCreated" />

        <!-- Edit modal -->
        <ApiKeyEditModal
            v-if="editTarget"
            v-model="showEditModal"
            :api-key="editTarget"
            @saved="onSaved"
        />

        <!-- Delete modal -->
        <ConfirmTypingDelete
            v-if="deleteTarget"
            v-model="showDeleteModal"
            :title="t('apiKeys.delete.title')"
            :warning="t('apiKeys.delete.warning')"
            :item-name="deleteTarget.name"
            :confirm-label="t('apiKeys.delete.confirm')"
            :cancel-label="t('common.cancel')"
            :pending="deletePending"
            :error="deleteError"
            @confirm="onDeleteConfirm(deleteTarget!)"
        />
    </BasePage>
</template>

<style scoped>
.api-key-row:hover {
    background-color: var(--bs-light-bg-subtle, rgba(0, 0, 0, 0.04));
}
</style>
