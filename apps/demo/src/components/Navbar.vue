<script setup lang="ts">
import { BNavForm } from 'bootstrap-vue-next';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
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

const visible = ref(false);
</script>

<template>
    <BNavbar v-b-color-mode="'dark'" toggleable="md" variant="primary">
        <BNavbarBrand to="/">Vue JSON Form Demo</BNavbarBrand>
        <BNavbarToggle v-b-toggle="'nav-collapse'" @click="console.log()" />
        <BCollapse id="nav-collapse" v-model="visible" is-nav>
            <BNavbarNav class="ms-auto">
                <BNavItem to="/showcase" :active="route.name === 'showcase'"
                    >Showcase</BNavItem
                >
                <BNavItem to="/wizard" :active="route.name === 'wizard'"
                    >Wizard</BNavItem
                >
                <BNavItem to="/custom" :active="route.name === 'custom'"
                    >Custom</BNavItem
                >
                <BNavItem
                    to="/ui-generator"
                    :active="route.name === 'ui-generator'"
                    >UI Generator</BNavItem
                >
                <BNavForm v-b-color-mode="theme">
                    <BFormSelect v-model="theme" :options="themeOptions" />
                </BNavForm>
            </BNavbarNav>
        </BCollapse>
    </BNavbar>
</template>

<style scoped></style>
