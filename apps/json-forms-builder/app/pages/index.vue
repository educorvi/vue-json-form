<script setup lang="ts">
/**
 * Landing page – unauthenticated home page.
 * Uses definePageMeta({ layout: false }) so it renders its own header/footer
 * instead of the base-layout used inside the app.
 */
definePageMeta({ layout: false });

const { loggedIn } = useUserSession();

if (loggedIn.value) {
    await navigateTo(Routes.DASHBOARD);
}

const route = useRoute();
const authError = computed(() => route.query.error === 'auth_failed');
</script>

<template>
    <div class="min-vh-100 d-flex flex-column bg-body-tertiary">
        <LandingHeader />

        <LandingHero :auth-error="authError" />

        <LandingScreenshot />

        <LandingFeatures />

        <LandingIntegrations />

        <LandingFooter />
    </div>
</template>
