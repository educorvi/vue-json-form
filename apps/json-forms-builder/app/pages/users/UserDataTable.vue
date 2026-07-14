<script setup lang="ts">
import type { z } from 'zod';
import TimestampStats from '~/components/utils/TimestampStats.vue';
import type { zUser } from '~~/server/orpc/generated/zod.gen';

type UserRow = z.infer<typeof zUser>;

const props = withDefaults(
    defineProps<{
        items: UserRow[];
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
}>();

const { t } = useI18n();

const fields = computed(() => [
    { key: 'user', label: t('users.columns.user') },
    {
        key: 'role',
        label: t('users.columns.role'),
    },
    { key: 'activity', label: t('users.columns.activity') },
]);
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
            variant="danger"
            :dismissible="false"
            class="mb-3"
        >
            <div class="d-flex align-items-center gap-2">
                <PhosphorIcon name="warning-circle" />
                <strong>{{ t('users.loadError') }}</strong>
            </div>
            <p class="mb-0 mt-1">{{ errorMessage }}</p>
        </BAlert>

        <BCard v-else>
            <BCardBody class="p-0">
                <BPlaceholderTable
                    v-if="showSkeleton"
                    :columns="3"
                    :rows="2"
                    animation="glow"
                >
                    <template #thead>
                        <BTr>
                            <BTh>{{ t('users.columns.user') }}</BTh>
                            <BTh>
                                {{ t('users.columns.role') }}
                            </BTh>
                            <BTh>{{ t('users.columns.activity') }}</BTh>
                        </BTr>
                    </template>
                </BPlaceholderTable>

                <!-- Empty -->
                <div v-else-if="isEmpty" class="p-4">
                    <EmptyState
                        :title="t('users.noUsersTitle')"
                        :description="
                            search
                                ? t('users.noSearchResults', {
                                      query: search,
                                  })
                                : t('users.noUsersDescription')
                        "
                    />
                </div>

                <!-- Real data -->
                <BTable
                    v-else
                    :items="stableItems"
                    :fields="fields"
                    :sort-internal="false"
                >
                    <template #cell(user)="data">
                        <UserPreviewCell
                            :name="(data.item as UserRow).name"
                            :email="(data.item as UserRow).email"
                        />
                    </template>
                    <template #cell(role)="data">
                        <UserRoleCell :role="(data.item as UserRow).role" />
                    </template>
                    <template #cell(activity)="data">
                        <TimestampStats
                            :created="(data.item as UserRow).created"
                            :updated="(data.item as UserRow).updated"
                        />
                    </template>
                </BTable>
            </BCardBody>

            <!-- Paginator -->
            <div v-if="!showSkeleton && !isEmpty">
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
