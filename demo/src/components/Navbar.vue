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

const visible = ref(true)
</script>

<template>
    <BNavbar toggleable="md" variant="primary" v-b-color-mode="'dark'">
        <BNavbarBrand href="/">Vue JSON Form Demo</BNavbarBrand>
        <BNavbarToggle v-b-toggle="'nav-collapse'" @click="console.log()" />
        <BCollapse id="nav-collapse" is-nav v-model="visible">
            <BNavbarNav class="ms-auto">
                <BNavForm>
                    <BFormSelect :options="themeOptions" v-model="theme"/>
                </BNavForm>
                <BNavItem href="/showcase" :active="route.name === 'showcase'">Showcase</BNavItem>
                <BNavItem href="/custom" :active="route.name === 'custom'">Custom</BNavItem>
            </BNavbarNav>
        </BCollapse>
    </BNavbar>
</template>

<style scoped>

</style>