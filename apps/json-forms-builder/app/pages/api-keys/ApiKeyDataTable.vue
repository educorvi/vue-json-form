<!--
    ApiKeyDataTable – API key list table.

    Mirrors UserDataTable: ListDataContainer (skeleton / empty / error
    states), BTable rows with column headers and client-side pagination.
    Row actions (edit/delete) are delegated to the parent via events.
-->
<script setup lang="ts">
import type { z } from 'zod';
import type { zApiKey } from '~~/server/orpc/generated/zod.gen';
import TimestampStats from '~/components/utils/TimestampStats.vue';

type ApiKeyRow = z.infer<typeof zApiKey>;

const props = withDefaults(
    defineProps<{
        items: ApiKeyRow[];
        pending: boolean;
        error: unknown;
        currentPage: number;
        pageSize: number;
        totalCount: number;
        search: string;
        pageSizeOptions?: number[];
    }>(),
    { pageSizeOptions: () => [10, 20, 50, 100] }
);

const emit = defineEmits<{
    'update:currentPage': [value: number];
    'update:pageSize': [value: number];
    edit: [key: ApiKeyRow];
    delete: [key: ApiKeyRow];
}>();

const { t, locale } = useI18n();

const fields = computed(() => [
    { key: 'name', label: t('apiKeys.columns.name') },
    { key: 'expires', label: t('apiKeys.columns.expires') },
    { key: 'activity', label: t('apiKeys.columns.activity') },
    {
        key: 'actions',
        label: t('apiKeys.columns.actions'),
        thClass: 'text-end',
    },
]);

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

// data-testid on body rows only (the e2e tests count/filter by it)
function rowAttrs(_item: ApiKeyRow | null, type: string) {
    return type === 'row' ? { 'data-testid': 'api-key-row' } : {};
}
</script>

<template>
    <ListDataContainer
        :items="items"
        :pending="pending"
        :error="error"
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
                            <BTh>{{ t('apiKeys.columns.expires') }}</BTh>
                            <BTh>{{ t('apiKeys.columns.activity') }}</BTh>
                            <BTh>{{ t('apiKeys.columns.actions') }}</BTh>
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
                <BTable
                    v-else
                    :items="stableItems"
                    :fields="fields"
                    primary-key="id"
                    hover
                    :sort-internal="false"
                    :tbody-tr-attrs="rowAttrs"
                >
                    <template #cell(name)="data">
                        <div class="d-flex align-items-center gap-2">
                            <span class="fw-bold text-body">
                                {{ data.item.name }}
                            </span>
                            <span
                                v-if="data.item.identifier"
                                class="font-monospace small text-secondary"
                                :title="t('apiKeys.columns.identifier')"
                            >
                                {{ data.item.identifier }}
                            </span>
                        </div>
                        <div
                            v-if="data.item.description"
                            class="text-secondary small text-truncate"
                        >
                            {{ data.item.description }}
                        </div>
                    </template>

                    <template #cell(expires)="data">
                        <BBadge v-if="isExpired(data.item)" variant="danger">
                            <Icon name="ph:warning" :size="12" />
                            {{ t('apiKeys.expired') }}
                        </BBadge>
                        <span v-else class="small text-secondary text-nowrap">
                            {{ expiresText(data.item) }}
                        </span>
                    </template>

                    <template #cell(activity)="data">
                        <TimestampStats
                            :created="data.item.created"
                            :updated="data.item.updated"
                        />
                    </template>

                    <template #cell(actions)="data">
                        <div class="d-flex justify-content-end">
                            <BDropdown
                                variant="link"
                                no-caret
                                toggle-class="text-secondary p-0 border-0"
                            >
                                <template #button-content>
                                    <Icon name="ph:dots-three" :size="18" />
                                </template>
                                <BDropdownItem @click="emit('edit', data.item)">
                                    <Icon name="ph:pencil" />
                                    {{ t('common.edit') }}
                                </BDropdownItem>
                                <BDropdownItem
                                    @click="emit('delete', data.item)"
                                >
                                    <Icon name="ph:trash" />
                                    {{ t('apiKeys.delete.title') }}
                                </BDropdownItem>
                            </BDropdown>
                        </div>
                    </template>
                </BTable>
            </BCardBody>

            <!-- Paginator -->
            <div v-if="!showSkeleton && !isEmpty" class="px-3 pb-3 pt-2">
                <ListPaginator
                    :current-page="currentPage"
                    :page-size="pageSize"
                    :total-count="totalCount"
                    :page-size-options="pageSizeOptions"
                    @update:current-page="
                        (v: number) => emit('update:currentPage', v)
                    "
                    @update:page-size="
                        (v: number) => emit('update:pageSize', v)
                    "
                />
            </div>
        </BCard>
    </ListDataContainer>
</template>
