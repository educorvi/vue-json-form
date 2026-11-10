<template>
    <header v-if="useRoute().query.nonav !== 'true'">
        <BNavbar
            v-b-color-mode="'dark'"
            variant="primary"
            toggleable="sm"
            sticky="top"
        >
            <BNavbarBrand href="/">VueJsonForm</BNavbarBrand>
            <BNavbarToggle target="nav-collapse" />
            <BCollapse id="nav-collapse" is-nav>
                <BNavbarNav>
                    <BNavItem :to="{ name: 'showcase' }">Showcase</BNavItem>
                    <BNavItem :to="{ name: 'reproduce' }">Reproduce</BNavItem>
                    <BNavItem :to="{ name: 'wizard' }">Wizard</BNavItem>
                    <BNavItem :to="{ name: 'custom-schema' }"
                        >Custom Schema</BNavItem
                    >
                    <BNavForm v-b-color-mode="theme" class="ms-auto">
                        <BFormSelect
                            v-model="theme"
                            :options="themeOptions"
                            aria-label="Theme selection"
                        />
                    </BNavForm>
                </BNavbarNav>
            </BCollapse>
        </BNavbar>
    </header>
    <main>
        <BApp>
            <div style="display: flex; justify-content: center">
                <div style="max-width: 700px; margin: 20px; width: 100%">
                    <RouterView />
                </div></div
        ></BApp>
    </main>
</template>

<script setup lang="ts">
import {
    BApp,
    BNavbar,
    BNavbarBrand,
    BCollapse,
    BNavbarNav,
    BNavItem,
    BNavbarToggle,
    BNavForm,
    BFormSelect,
} from 'bootstrap-vue-next';
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';

const themeOptions = [
    {
        value: 'light',
        text: 'Light mode',
    },
    {
        value: 'dark',
        text: 'Dark mode',
    },
];

const theme = ref('light');

const html = document.querySelector('html');

watch(theme, (newValue) => {
    html?.setAttribute('data-bs-theme', newValue);
});
</script>

<style scoped></style>
