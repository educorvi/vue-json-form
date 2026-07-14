<script setup lang="ts">
defineProps<{
    forms: any[];
    pending: boolean;
}>();

const { t } = useI18n();
</script>

<template>
    <section class="mb-5">
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fw-semibold mb-0">
                {{ t('dashboard.recentForms') }}
            </h5>
            <NuxtLink :to="Routes.FORMS" class="btn btn-sm btn-outline-primary">
                {{ t('dashboard.allForms') }}
                <PhosphorIcon name="arrow-right" :size="14" class="ms-1" />
            </NuxtLink>
        </div>

        <div v-if="pending" class="row g-3">
            <div v-for="i in 6" :key="i" class="col-lg-4 col-md-6">
                <BCard>
                    <BCardBody>
                        <BPlaceholder animation="glow">
                            <BPlaceholder class="w-75" />
                        </BPlaceholder>
                        <BPlaceholder animation="glow">
                            <BPlaceholder class="w-50" size="sm" />
                        </BPlaceholder>
                    </BCardBody>
                </BCard>
            </div>
        </div>

        <div v-else-if="forms.length === 0">
            <BCard class="text-center py-4">
                <BCardBody>
                    <PhosphorIcon
                        name="file-text"
                        :size="32"
                        class="text-secondary mb-2"
                    />
                    <p class="text-secondary mb-0">
                        {{ t('dashboard.recentFormsEmpty') }}
                    </p>
                </BCardBody>
            </BCard>
        </div>

        <div v-else class="row g-3">
            <div v-for="form in forms" :key="form.id" class="col-lg-4 col-md-6">
                <NuxtLink
                    :to="Routes.formDetailPath(form)"
                    class="text-decoration-none"
                >
                    <BCard class="h-100 dashboard-card">
                        <BCardBody class="d-flex flex-column h-100">
                            <div class="d-flex flex-column gap-2 flex-grow-1">
                                <!-- Top: title + path -->
                                <div class="d-flex align-items-start gap-3">
                                    <PhosphorIcon
                                        name="file-text"
                                        :size="20"
                                        class="text-secondary flex-shrink-0 mt-1"
                                    />
                                    <div class="min-w-0 flex-grow-1">
                                        <p class="fw-medium mb-1 text-truncate">
                                            {{ form.title }}
                                        </p>
                                        <BreadcrumbInline
                                            v-if="
                                                form.parent_path &&
                                                form.parent_path.length > 0
                                            "
                                            :parent-path="form.parent_path"
                                        />
                                    </div>
                                </div>

                                <!-- Middle: description -->
                                <p
                                    v-if="form.description"
                                    class="small text-secondary mb-0"
                                    style="
                                        display: -webkit-box;
                                        -webkit-line-clamp: 2;
                                        -webkit-box-orient: vertical;
                                        overflow: hidden;
                                    "
                                >
                                    {{ form.description }}
                                </p>

                                <!-- Bottom: timestamp right-aligned -->
                                <div
                                    class="d-flex justify-content-end align-items-center gap-2 small text-secondary mt-auto"
                                >
                                    <PhosphorIcon
                                        name="clock"
                                        :size="12"
                                        class="flex-shrink-0"
                                    />
                                    <span>{{
                                        formatDate(
                                            form.updated_by?.timestamp,
                                            true
                                        )
                                    }}</span>
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
