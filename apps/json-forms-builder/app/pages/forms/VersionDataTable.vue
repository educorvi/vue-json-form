<!--
    VersionDataTable – Form version history table.

    Mirrors UserDataTable: ListDataContainer (skeleton / empty / error
    states), BTable rows with column headers and pagination. Row actions
    (preview / inspect json+ui artifacts) are delegated to the parent
    via events.
-->
<script setup lang="ts">
import type { z } from 'zod';
import type { zFormVersionRef } from '~~/server/orpc/generated/zod.gen';

type VersionRow = z.infer<typeof zFormVersionRef>;

const props = withDefaults(
    defineProps<{
        items: VersionRow[];
        pending: boolean;
        error: unknown;
        currentPage: number;
        pageSize: number;
        totalCount: number;
        pageSizeOptions?: number[];
    }>(),
    { pageSizeOptions: () => [10, 20, 50, 100] }
);

const emit = defineEmits<{
    'update:currentPage': [value: number];
    'update:pageSize': [value: number];
    preview: [version: VersionRow];
    artifacts: [version: VersionRow];
}>();

const { t } = useI18n();

const fields = computed(() => [
    { key: 'version', label: t('forms.versions.columns.version') },
    { key: 'comment', label: t('forms.versions.columns.comment') },
    { key: 'created', label: t('forms.versions.columns.created') },
    {
        key: 'actions',
        label: t('forms.versions.columns.actions'),
        thClass: 'text-end',
    },
]);

function formatCreated(version: VersionRow): string {
    const ts = version.created_by?.timestamp;
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
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
                <strong>{{ t('forms.versions.loadError') }}</strong>
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
                            <BTh>{{ t('forms.versions.columns.version') }}</BTh>
                            <BTh>{{ t('forms.versions.columns.comment') }}</BTh>
                            <BTh>{{ t('forms.versions.columns.created') }}</BTh>
                            <BTh>{{ t('forms.versions.columns.actions') }}</BTh>
                        </BTr>
                    </template>
                </BPlaceholderTable>

                <!-- Empty -->
                <div v-else-if="isEmpty" class="p-4">
                    <EmptyState
                        icon="ph:clock-counter-clockwise"
                        :title="t('forms.versions.noVersionsTitle')"
                        :description="t('forms.versions.noVersionsDescription')"
                    />
                </div>

                <!-- Real data -->
                <BTable
                    v-else
                    :items="stableItems"
                    :fields="fields"
                    primary-key="version"
                    hover
                    :sort-internal="false"
                >
                    <template #cell(version)="data">
                        <span class="fw-medium font-monospace">
                            {{ data.item.version }}
                        </span>
                    </template>

                    <template #cell(comment)="data">
                        <span class="text-secondary">
                            {{ data.item.comment || '—' }}
                        </span>
                    </template>

                    <template #cell(created)="data">
                        <div class="text-secondary">
                            {{ formatCreated(data.item) }}
                        </div>
                        <div class="text-muted small">
                            {{ data.item.created_by?.name ?? '' }}
                        </div>
                    </template>

                    <template #cell(actions)="data">
                        <div class="d-flex justify-content-end gap-1">
                            <BButton
                                variant="outline-primary"
                                size="sm"
                                @click="emit('preview', data.item)"
                            >
                                <Icon
                                    name="ph:play"
                                    :size="14"
                                    class="me-1"
                                />{{ t('forms.versions.preview') }}
                            </BButton>
                            <BButton
                                variant="outline-secondary"
                                size="sm"
                                @click="emit('artifacts', data.item)"
                            >
                                <Icon
                                    name="ph:code-block"
                                    :size="14"
                                    class="me-1"
                                />{{ t('forms.versions.viewArtifacts') }}
                            </BButton>
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
