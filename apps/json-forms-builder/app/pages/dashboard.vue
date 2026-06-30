<script setup lang="ts">
import { PhUsers, PhCode, PhWarningCircle } from '@phosphor-icons/vue';

definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });

const { t } = useI18n();
const orpc = useNuxtApp().$orpc;

const {
    data: status,
    pending,
    error,
} = useLazyAsyncData('status', () => orpc.status.get());

const badgeVariant = computed(() => {
    if (!status.value) return 'secondary';
    if (status.value.status === 'ok') return 'success';
    if (status.value.status === 'degraded') return 'warning';
    return 'danger';
});
</script>

<template>
    <BasePage
        :title="t('dashboard.title')"
        :description="t('dashboard.subtitle')"
    >
        <!-- Status card -->
        <BCard class="mb-4">
            <BCardBody>
                <h6 class="fw-semibold mb-3">{{ t('dashboard.apiStatus') }}</h6>
                <div v-if="pending" class="d-flex align-items-center gap-3">
                    <span class="placeholder col-4 rounded-pill"></span>
                    <span class="placeholder col-2 rounded"></span>
                </div>
                <div v-else-if="error" class="d-flex gap-2 text-danger">
                    <PhWarningCircle :size="18" />
                    {{ t('dashboard.apiError') }} {{ error.message }}
                </div>
                <div v-else-if="status" class="d-flex gap-3">
                    <span :class="'badge bg-' + badgeVariant">
                        {{ status.status.toUpperCase() }}
                    </span>
                    <span class="small text-secondary"
                        >v{{ status.version }}</span
                    >
                </div>
            </BCardBody>
        </BCard>

        <!-- Navigation cards -->
        <div class="row row-cols-1 row-cols-md-2 g-3">
            <div class="col">
                <NuxtLink to="/users" class="text-decoration-none">
                    <BCard class="h-100">
                        <BCardBody>
                            <div class="d-flex align-items-start gap-3">
                                <div
                                    class="d-flex align-items-center justify-content-center rounded"
                                    style="
                                        width: 40px;
                                        height: 40px;
                                        background-color: var(
                                            --bs-primary-bg-subtle
                                        );
                                        flex-shrink: 0;
                                    "
                                >
                                    <PhUsers :size="20" class="text-primary" />
                                </div>
                                <div>
                                    <p class="fw-semibold mb-0">
                                        {{ t('dashboard.navUsers') }}
                                    </p>
                                    <p class="small text-secondary mb-0">
                                        {{ t('dashboard.navUsersDesc') }}
                                    </p>
                                </div>
                            </div>
                        </BCardBody>
                    </BCard>
                </NuxtLink>
            </div>

            <div class="col">
                <a
                    href="/_swagger"
                    target="_blank"
                    class="text-decoration-none"
                >
                    <BCard class="h-100">
                        <BCardBody>
                            <div class="d-flex align-items-start gap-3">
                                <div
                                    class="d-flex align-items-center justify-content-center rounded"
                                    style="
                                        width: 40px;
                                        height: 40px;
                                        background-color: var(
                                            --bs-success-bg-subtle
                                        );
                                        flex-shrink: 0;
                                    "
                                >
                                    <PhCode :size="20" class="text-success" />
                                </div>
                                <div>
                                    <p class="fw-semibold mb-0">
                                        {{ t('dashboard.navApiDocs') }}
                                    </p>
                                    <p class="small text-secondary mb-0">
                                        {{ t('dashboard.navApiDocsDesc') }}
                                    </p>
                                </div>
                            </div>
                        </BCardBody>
                    </BCard>
                </a>
            </div>
        </div>
    </BasePage>
</template>
