<script setup lang="ts">
/**
 * Landing page – unauthenticated home page.
 * Uses definePageMeta({ layout: false }) so it renders its own header/footer
 * instead of the base-layout used inside the app.
 */
definePageMeta({ layout: false });

import LandingHeader from '@/pages/landing/LandingHeader.vue';
import LandingHero from '@/pages/landing/LandingHero.vue';
import LandingScreenshot from '@/pages/landing/LandingScreenshot.vue';
import LandingFeatures from '@/pages/landing/LandingFeatures.vue';
import LandingIntegrations from '@/pages/landing/LandingIntegrations.vue';
import LandingFooter from '@/pages/landing/LandingFooter.vue';

const { loggedIn } = useUserSession();

if (loggedIn.value) {
    await navigateTo('/dashboard');
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
