<script setup lang="ts">
import { BNavForm } from 'bootstrap-vue-next';
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'


const route = useRoute()
const themeOptions = [
    {
        value: 'light', text: 'Light mode',
    },
    {
        value: 'dark', text: 'Dark mode',
    }
];

const theme = ref('light')

const html = document.querySelector("html")

watch(theme, (newValue) => {
    html?.setAttribute('data-bs-theme', newValue);
});
</script>

<template>
    <BNavbar :toggleable="false" variant="primary" v-b-color-mode="'dark'">
        <BNavbarBrand href="/">Vue JSON Form Demo</BNavbarBrand>
        <BNavbarToggle target="nav-collapse" />
        <BCollapse id="nav-collapse" is-nav>
            <BNavbarNav class="ms-auto">
                <BNavForm>
                    <BFormSelect :options="themeOptions" v-model="theme"/>
                </BNavForm>
                <BNavItem href="/showcase" :active="route.name === 'showcase'">Showcase</BNavItem>
                <BNavItem href="/about" :active="route.name === 'about'">About</BNavItem>
            </BNavbarNav>
        </BCollapse>
    </BNavbar>
</template>

<style scoped>

</style>