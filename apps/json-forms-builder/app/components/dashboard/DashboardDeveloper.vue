<script setup lang="ts">
import { APP_LINKS } from '~~/app/utils/links';

const { t } = useI18n();
const orpc = useNuxtApp().$orpc;

// ── API Status with ping latency ────────────────────────────────────────

const {
    data: apiStatus,
    pending: statusPending,
    error: statusError,
    refresh: refreshStatus,
} = useLazyAsyncData('dashboard-api-status', () => orpc.status.get());

const pingMs = ref<number | null>(null);

async function measurePing() {
    const start = performance.now();
    try {
        await refreshStatus();
        pingMs.value = Math.round(performance.now() - start);
    } catch {
        pingMs.value = null;
    }
}

onMounted(() => {
    // Measure ping on first load
    if (!statusPending.value && !statusError.value) {
        pingMs.value = 0; // Already cached, no real measurement
    }
    // Do a fresh ping after initial load
    setTimeout(() => measurePing(), 500);
});

const badgeVariant = computed(() => {
    if (!apiStatus.value) return 'secondary';
    if (apiStatus.value.status === 'ok') return 'success';
    if (apiStatus.value.status === 'degraded') return 'warning';
    return 'danger';
});
</script>

<template>
    <section>
        <h5 class="fw-semibold mb-3">
            {{ t('dashboard.developer') }}
        </h5>

        <!-- API Status — full width -->
        <BCard class="mb-3">
            <BCardBody>
                <div class="d-flex align-items-start gap-3">
                    <div
                        class="d-flex align-items-center justify-content-center rounded"
                        style="
                            width: 40px;
                            height: 40px;
                            flex-shrink: 0;
                            background-color: var(--bs-warning-bg-subtle);
                        "
                    >
                        <PhosphorIcon
                            name="activity"
                            :size="20"
                            class="text-warning"
                        />
                    </div>
                    <div class="flex-grow-1">
                        <p class="fw-semibold mb-2">
                            {{ t('dashboard.apiStatus') }}
                        </p>
                        <div v-if="statusPending" class="d-flex gap-3">
                            <span class="placeholder col-2 rounded-pill"></span>
                            <span class="placeholder col-1 rounded"></span>
                            <span class="placeholder col-1 rounded"></span>
                        </div>
                        <div
                            v-else-if="statusError"
                            class="text-danger small d-flex align-items-center gap-2"
                        >
                            <PhosphorIcon name="warning-circle" :size="16" />
                            {{ t('dashboard.apiError') }}
                            {{ statusError.message }}
                        </div>
                        <div
                            v-else-if="apiStatus"
                            class="d-flex flex-wrap align-items-center gap-3"
                        >
                            <span :class="'badge bg-' + badgeVariant + ' fs-6'">
                                {{ apiStatus.status.toUpperCase() }}
                            </span>
                            <span class="small text-secondary">
                                {{ t('dashboard.version') }}:
                                <span class="fw-medium">{{
                                    apiStatus.version
                                }}</span>
                            </span>
                            <span class="small text-secondary">
                                {{ t('dashboard.ping') }}:
                                <span
                                    class="fw-medium"
                                    :class="{
                                        'text-success':
                                            pingMs != null && pingMs < 200,
                                        'text-warning':
                                            pingMs != null &&
                                            pingMs >= 200 &&
                                            pingMs < 500,
                                        'text-danger':
                                            pingMs != null && pingMs >= 500,
                                    }"
                                >
                                    {{ pingMs != null ? pingMs + 'ms' : '—' }}
                                </span>
                            </span>
                            <BButton
                                size="sm"
                                variant="outline-secondary"
                                @click="measurePing"
                            >
                                <PhosphorIcon
                                    name="arrows-clockwise"
                                    :size="12"
                                />
                            </BButton>
                        </div>
                    </div>
                </div>
            </BCardBody>
        </BCard>

        <!-- Docs cards side by side -->
        <div class="row row-cols-1 row-cols-md-2 g-3">
            <div class="col">
                <a
                    :href="APP_LINKS.swagger"
                    target="_blank"
                    class="text-decoration-none"
                >
                    <BCard class="h-100 dashboard-doc-card">
                        <BCardBody>
                            <div class="d-flex align-items-start gap-3">
                                <div
                                    class="d-flex align-items-center justify-content-center rounded"
                                    style="
                                        width: 40px;
                                        height: 40px;
                                        flex-shrink: 0;
                                        background-color: var(
                                            --bs-info-bg-subtle
                                        );
                                    "
                                >
                                    <PhosphorIcon
                                        name="code"
                                        :size="20"
                                        class="text-info"
                                    />
                                </div>
                                <div>
                                    <p class="fw-semibold mb-1">Swagger</p>
                                    <p class="small text-secondary mb-0">
                                        {{ t('dashboard.apiDocsDesc') }}
                                    </p>
                                </div>
                            </div>
                        </BCardBody>
                    </BCard>
                </a>
            </div>
            <div class="col">
                <a
                    :href="APP_LINKS.scalar"
                    target="_blank"
                    class="text-decoration-none"
                >
                    <BCard class="h-100 dashboard-doc-card">
                        <BCardBody>
                            <div class="d-flex align-items-start gap-3">
                                <div
                                    class="d-flex align-items-center justify-content-center rounded"
                                    style="
                                        width: 40px;
                                        height: 40px;
                                        flex-shrink: 0;
                                        background-color: var(
                                            --bs-secondary-bg-subtle
                                        );
                                    "
                                >
                                    <PhosphorIcon
                                        name="link"
                                        :size="20"
                                        class="text-secondary"
                                    />
                                </div>
                                <div>
                                    <p class="fw-semibold mb-1">
                                        Scalar API Docs
                                    </p>
                                    <p class="small text-secondary mb-0">
                                        {{ t('dashboard.apiDocsDesc') }}
                                    </p>
                                </div>
                            </div>
                        </BCardBody>
                    </BCard>
                </a>
            </div>
        </div>
    </section>
</template>

<style scoped>
.dashboard-doc-card {
    transition:
        box-shadow 0.15s ease-in-out,
        border-color 0.15s ease-in-out;
}
.dashboard-doc-card:hover {
    border-color: var(--bs-primary);
    box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.08);
}
</style>
