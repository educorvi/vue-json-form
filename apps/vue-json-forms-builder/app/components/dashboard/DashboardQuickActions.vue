<script setup lang="ts">
const { t } = useI18n();
const permissions = usePermissionsStore();
</script>

<template>
    <section
        v-if="permissions.canCreateRootForms || permissions.canCreateRootGroups"
        class="mb-5"
        data-testid="dashboard-quick-actions"
    >
        <h5 class="fw-semibold mb-3">
            {{ t('dashboard.quickActions') }}
        </h5>
        <div class="row row-cols-1 row-cols-md-2 g-3">
            <div v-if="permissions.canCreateRootForms" class="col">
                <NuxtLink
                    :to="Routes.FORMS_NEW"
                    class="text-decoration-none"
                    data-testid="quick-action-new-form"
                >
                    <BCard class="h-100 dashboard-card">
                        <BCardBody>
                            <div class="d-flex align-items-start gap-3">
                                <div
                                    class="d-flex align-items-center justify-content-center rounded"
                                    style="
                                        width: 48px;
                                        height: 48px;
                                        flex-shrink: 0;
                                        background-color: var(
                                            --bs-primary-bg-subtle
                                        );
                                    "
                                >
                                    <Icon
                                        name="ph:file-plus"
                                        :size="24"
                                        class="text-primary"
                                    />
                                </div>
                                <div>
                                    <p class="fw-semibold mb-1">
                                        {{ t('dashboard.createForm') }}
                                    </p>
                                    <p class="small text-secondary mb-0">
                                        {{ t('dashboard.createFormDesc') }}
                                    </p>
                                </div>
                            </div>
                        </BCardBody>
                    </BCard>
                </NuxtLink>
            </div>
            <div v-if="permissions.canCreateRootGroups" class="col">
                <NuxtLink
                    :to="Routes.GROUPS_NEW"
                    class="text-decoration-none"
                    data-testid="quick-action-new-group"
                >
                    <BCard class="h-100 dashboard-card">
                        <BCardBody>
                            <div class="d-flex align-items-start gap-3">
                                <div
                                    class="d-flex align-items-center justify-content-center rounded"
                                    style="
                                        width: 48px;
                                        height: 48px;
                                        flex-shrink: 0;
                                        background-color: var(
                                            --bs-success-bg-subtle
                                        );
                                    "
                                >
                                    <Icon
                                        name="ph:folder-plus"
                                        :size="24"
                                        class="text-success"
                                    />
                                </div>
                                <div>
                                    <p class="fw-semibold mb-1">
                                        {{ t('dashboard.createGroup') }}
                                    </p>
                                    <p class="small text-secondary mb-0">
                                        {{ t('dashboard.createGroupDesc') }}
                                    </p>
                                </div>
                            </div>
                        </BCardBody>
                    </BCard>
                </NuxtLink>
            </div>
        </div>
    </section>
</template>

<style scoped>
.dashboard-card {
    transition:
        box-shadow 0.15s ease-in-out,
        border-color 0.15s ease-in-out;
}
.dashboard-card:hover {
    border-color: var(--bs-primary);
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}
</style>
