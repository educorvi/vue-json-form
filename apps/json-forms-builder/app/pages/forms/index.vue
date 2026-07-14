<script setup lang="ts">
/**
 * /forms — All forms list (flat, no hierarchy).
 *
 * Shows every form in a paginated table with:
 * - Parent path rendered as a breadcrumb-like element
 * - Form title, timestamps
 * - Sort by updated (default), title, created
 * - Actions: edit, delete
 */
import type { z } from 'zod';
import type { zListFormsQuery, zForm } from '~~/server/orpc/generated/zod.gen';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';
import TimestampStats from '~/components/utils/TimestampStats.vue';
import ConfirmTypingDelete from '@/components/utils/ConfirmTypingDelete.vue';
type FormsQuery = z.infer<typeof zListFormsQuery>;
type OrderBy = NonNullable<FormsQuery['order_by']>;
type FormRow = z.infer<typeof zForm>;

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const router = useRouter();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

useAppBreadcrumb().set('forms');

// ── Query state ───────────────────────────────────────────────────────────
const page = ref(1);
const pageSize = ref(20);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('desc');
const orderBy = ref<OrderBy>('updated');

const sortOptions: { label: string; value: OrderBy }[] = [
    { label: t('forms.sortBy.updated'), value: 'updated' },
    { label: t('forms.sortBy.title'), value: 'title' },
    { label: t('forms.sortBy.created'), value: 'created' },
];

const queryInput = computed<FormsQuery>(() => ({
    page: page.value,
    page_size: pageSize.value,
    search: search.value || undefined,
    sort_order: sortOrder.value,
    order_by: orderBy.value,
}));

const { data, pending, error } = useLazyAsyncData(
    'forms',
    () => orpc.forms.list({ query: queryInput.value }),
    { watch: [queryInput] }
);

function onSearchChange(val: string) {
    search.value = val;
    page.value = 1;
}

// ── Delete modal ──────────────────────────────────────────────────────────
const deleteTarget = ref<FormRow | null>(null);
const showDeleteModal = ref(false);
const deletePending = ref(false);
const deleteError = ref<string | null>(null);

function onDelete(form: FormRow) {
    deleteTarget.value = form;
    showDeleteModal.value = true;
    deleteError.value = null;
}

async function onDeleteConfirm(form: FormRow) {
    deletePending.value = true;
    deleteError.value = null;
    try {
        await orpc.forms.delete({ params: { id: String(form.id) } });
        showDeleteModal.value = false;
        deleteTarget.value = null;
        refreshNuxtData('forms');
    } catch (err: any) {
        deleteError.value = err?.message ?? String(err);
    } finally {
        deletePending.value = false;
    }
}

function onEdit(form: FormRow) {
    const path = buildFormUrlPath(form as any);
    if (path) {
        router.push(Routes.formsEdit(path));
    }
}

function onNavigate(form: FormRow) {
    const path = buildFormUrlPath(form as any);
    router.push(Routes.formsDetail(path));
}

function formLink(form: FormRow): string {
    const path = buildFormUrlPath(form as any);
    return path ? Routes.formsDetail(path) : '';
}

// ── Description ───────────────────────────────────────────────────────────
const pageDescription = computed(() => {
    if (data.value?.total_count != null) {
        return t(
            'forms.total',
            { n: data.value.total_count },
            data.value.total_count
        );
    }
    return undefined;
});
</script>

<template>
    <BasePage
        :title="t('forms.title')"
        :description="pageDescription"
        icon="file-text"
    >
        <template #actions>
            <BButton variant="primary" size="sm" :to="Routes.FORMS_NEW">
                <PhosphorIcon name="plus" class="me-1" />
                {{ t('forms.new.title') }}
            </BButton>
        </template>

        <ListToolbar
            v-model:search="search"
            v-model:order-by="orderBy"
            v-model:sort-order="sortOrder"
            :sort-options="sortOptions"
            :search-placeholder="t('forms.searchPlaceholder')"
            class="mb-3"
            @update:search="onSearchChange"
        />

        <ListDataContainer
            :items="data?.data ?? []"
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
            <BAlert
                v-if="hasError"
                variant="danger"
                :dismissible="false"
                class="mb-3"
            >
                <div class="d-flex align-items-center gap-2">
                    <PhosphorIcon name="warning-circle" />
                    <strong>{{ t('forms.loadError') }}</strong>
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
                        <template #thead>
                            <BTr>
                                <BTh>{{ t('forms.title') }}</BTh>
                            </BTr>
                        </template>
                    </BPlaceholderTable>

                    <div v-else-if="isEmpty" class="p-4">
                        <EmptyState
                            icon="file-text"
                            :title="t('forms.noFormsTitle')"
                            :description="
                                search
                                    ? t('forms.noSearchResults', {
                                          query: search,
                                      })
                                    : t('forms.noFormsDescription')
                            "
                        />
                    </div>

                    <template v-else>
                        <div
                            v-for="form in stableItems"
                            :key="form.id"
                            class="d-flex align-items-center gap-2 py-2 px-3 border-bottom form-row"
                            style="cursor: pointer"
                            @click="onNavigate(form)"
                        >
                            <!-- Path breadcrumb + title -->
                            <div class="flex-grow-1 min-w-0" @click.stop>
                                <div class="d-flex align-items-center gap-0">
                                    <BreadcrumbInline
                                        v-if="(form as any).parent_path?.length"
                                        :parent-path="(form as any).parent_path"
                                    />
                                    <span
                                        v-if="(form as any).parent_path?.length"
                                        class="text-secondary opacity-50 mx-1"
                                        >/</span
                                    >
                                    <NuxtLink
                                        :to="formLink(form)"
                                        class="fw-bold text-decoration-none text-body"
                                        @click.stop="onNavigate(form)"
                                    >
                                        {{ form.title }}
                                    </NuxtLink>
                                </div>
                                <div
                                    v-if="(form as any).description"
                                    class="text-secondary small text-truncate"
                                >
                                    {{ (form as any).description }}
                                </div>
                            </div>

                            <!-- Timestamp + actions (right side) -->
                            <div
                                class="d-flex align-items-center gap-2 flex-shrink-0"
                                @click.stop
                            >
                                <TimestampStats
                                    :created="form.created_by?.timestamp"
                                    :updated="form.updated_by?.timestamp"
                                />

                                <BDropdown
                                    variant="link"
                                    no-caret
                                    toggle-class="text-secondary p-0 border-0"
                                >
                                    <template #button-content>
                                        <PhosphorIcon
                                            name="dots-three"
                                            :size="18"
                                        />
                                    </template>
                                    <BDropdownItem @click="onEdit(form)">
                                        <PhosphorIcon name="pencil" />
                                        {{ t('common.edit') }}
                                    </BDropdownItem>
                                    <BDropdownItem @click="onDelete(form)">
                                        <PhosphorIcon name="trash" />
                                        {{ t('forms.delete.title') }}
                                    </BDropdownItem>
                                </BDropdown>
                            </div>
                        </div>
                    </template>
                </BCardBody>

                <div
                    v-if="!showSkeleton && !isEmpty && data"
                    class="px-3 pb-3 pt-2"
                >
                    <ListPaginator
                        :current-page="page"
                        :page-size="pageSize"
                        :total-count="data.total_count"
                        @update:current-page="(v: number) => (page = v)"
                        @update:page-size="(v: number) => (pageSize = v)"
                    />
                </div>
            </BCard>
        </ListDataContainer>

        <!-- Delete modal -->
        <ConfirmTypingDelete
            v-if="deleteTarget"
            v-model="showDeleteModal"
            :title="t('forms.delete.title')"
            :warning="t('forms.delete.warning')"
            :item-name="deleteTarget.title ?? deleteTarget.name ?? ''"
            :confirm-label="t('forms.delete.confirm')"
            :cancel-label="t('common.cancel')"
            :pending="deletePending"
            :error="deleteError"
            @confirm="onDeleteConfirm(deleteTarget!)"
        />
    </BasePage>
</template>

<style scoped>
.form-row:hover {
    background-color: var(--bs-light-bg-subtle, rgba(0, 0, 0, 0.04));
}
</style>
