<!--
    PermissionTable – Displays permissions in a table with user info, role,
    scope (source), expiration, and actions.

    Reuses UserPreviewCell for rendering user details.
    Uses PermissionRoleTag for rendering role badges.
    Uses ListPaginator for pagination.
-->
<script setup lang="ts">
import type { PermissionEntry } from '@/composables/usePermission';
import TimestampStats from '~/components/utils/TimestampStats.vue';

defineProps<{
    permissions: PermissionEntry[];
    loading?: boolean;
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}>();

const emit = defineEmits<{
    'update:currentPage': [value: number];
    'update:pageSize': [value: number];
    edit: [permission: PermissionEntry];
    delete: [permission: PermissionEntry];
}>();

const { t, locale } = useI18n();

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return t('permissions.never');
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t('permissions.never');
    return new Intl.DateTimeFormat(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
}

function formatExpire(
    expire: string | null | undefined,
    expired: boolean
): string {
    if (!expire) return t('permissions.never');
    const prefix = expired ? `(${t('permissions.expired')}) ` : '';
    return prefix + formatDate(expire);
}
</script>

<template>
    <div>
        <!-- Loading overlay -->
        <div v-if="loading" class="text-center py-4">
            <BSpinner variant="primary" />
        </div>

        <!-- Empty state -->
        <div
            v-else-if="permissions.length === 0"
            class="text-center text-secondary small py-4"
        >
            {{ t('permissions.noPermissions') }}
        </div>

        <!-- Table -->
        <BTableSimple v-else striped hover responsive class="small mb-0">
            <BThead>
                <BTr>
                    <BTh>{{ t('permissions.columns.user') }}</BTh>
                    <BTh>{{ t('permissions.columns.role') }}</BTh>
                    <BTh>{{ t('permissions.columns.scope') }}</BTh>
                    <BTh>{{ t('permissions.columns.expires') }}</BTh>
                    <BTh>{{ t('permissions.columns.added') }}</BTh>
                    <BTh class="text-end">{{
                        t('permissions.columns.actions')
                    }}</BTh>
                </BTr>
            </BThead>
            <BTbody>
                <BTr v-for="perm in permissions" :key="perm.id">
                    <!-- User column -->
                    <BTd>
                        <UserPreviewCell
                            :name="perm.user?.name ?? ''"
                            :email="perm.user?.email ?? ''"
                        />
                    </BTd>

                    <!-- Role column -->
                    <BTd>
                        <PermissionRoleTag :role="perm.role ?? ''" />
                    </BTd>

                    <!-- Scope / Source column -->
                    <BTd>
                        <template v-if="perm.scope === 'direct'">
                            <span class="text-secondary">
                                {{ t('permissions.scope.direct') }}
                            </span>
                        </template>
                        <template v-else>
                            <span class="text-secondary">
                                {{ t('permissions.scope.inherited') }}
                            </span>
                            <div
                                v-if="perm.source_group_path?.length"
                                class="d-block"
                            >
                                <span class="text-muted small d-block">
                                    {{
                                        t('permissions.inheritedFrom', {
                                            group:
                                                perm.source_group_path[
                                                    perm.source_group_path
                                                        .length - 1
                                                ]?.name ?? '',
                                        })
                                    }}
                                </span>
                                <BreadcrumbInline
                                    :parent-path="perm.source_group_path"
                                    fragment="permissions"
                                />
                            </div>
                        </template>
                    </BTd>

                    <!-- Expiration column -->
                    <BTd>
                        <span
                            :class="{
                                'text-danger fw-medium': perm.expired,
                                'text-secondary': !perm.expired,
                            }"
                        >
                            {{ formatExpire(perm.expire, perm.expired) }}
                        </span>
                    </BTd>

                    <!-- Added timestamp (using created_by/updated_by like user tables) -->
                    <BTd class="text-secondary">
                        <TimestampStats
                            :created="perm.created_by?.timestamp"
                            :updated="perm.updated_by?.timestamp"
                        />
                    </BTd>

                    <!-- Actions column -->
                    <BTd class="text-end">
                        <template v-if="perm.scope === 'direct'">
                            <BButton
                                variant="outline-secondary"
                                size="sm"
                                class="me-1"
                                @click="emit('edit', perm)"
                            >
                                <PhosphorIcon name="pencil-simple" :size="14" />
                            </BButton>
                            <BButton
                                variant="outline-danger"
                                size="sm"
                                @click="emit('delete', perm)"
                            >
                                <PhosphorIcon name="trash" :size="14" />
                            </BButton>
                        </template>
                    </BTd>
                </BTr>
            </BTbody>
        </BTableSimple>

        <!-- Paginator -->
        <div v-if="totalCount > 0" class="mt-2">
            <ListPaginator
                :current-page="currentPage"
                :page-size="pageSize"
                :total-count="totalCount"
                @update:current-page="emit('update:currentPage', $event)"
                @update:page-size="emit('update:pageSize', $event)"
            />
        </div>
    </div>
</template>
