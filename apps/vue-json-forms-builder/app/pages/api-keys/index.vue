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
import ApiKeyDataTable from './ApiKeyDataTable.vue';
import ConfirmTypingDelete from '@/components/utils/ConfirmTypingDelete.vue';
import ApiKeyCreateModal from '~/components/api-key/ApiKeyCreateModal.vue';
import ApiKeyEditModal from '~/components/api-key/ApiKeyEditModal.vue';

type ApiKeyRow = z.infer<typeof zApiKey>;
type OrderBy = 'name' | 'created' | 'updated' | 'expires_at';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const { notify } = useNotify();
const orpc = useNuxtApp().$orpc;

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

// Sorting/order changes reset to the first page (search is handled via
// @update:search → onSearchChange).
watch([orderBy, sortOrder], () => {
    page.value = 1;
});

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

        <ApiKeyDataTable
            :items="pageItems"
            :pending="pending"
            :error="error ?? null"
            :current-page="page"
            :page-size="pageSize"
            :total-count="totalCount"
            :search="search"
            @edit="onEdit"
            @delete="onDelete"
            @update:current-page="(v: number) => (page = v)"
            @update:page-size="(v: number) => (pageSize = v)"
        />

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
