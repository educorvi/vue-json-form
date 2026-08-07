<script setup lang="ts">
const preferences = usePreferencesStore();
</script>

<template>
    <Html :data-bs-theme="preferences.resolvedTheme">
        <Body>
            <NuxtRouteAnnouncer />
            <NuxtLayout>
                <NuxtPage :key="$route.fullPath" />
            </NuxtLayout>
            <ToastContainer />
        </Body>
    </Html>
</template>
