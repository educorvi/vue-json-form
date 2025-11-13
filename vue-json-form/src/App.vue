<template>
    <header v-if="useRoute().query.nonav !== 'true'">
        <BNavbar
            variant="primary"
            toggleable="sm"
            v-b-color-mode="'dark'"
            sticky="top"
        >
            <BNavbarBrand href="/">VueJsonForm</BNavbarBrand>
            <BNavbarToggle target="nav-collapse" />
            <BCollapse id="nav-collapse" is-nav>
                <BNavbarNav>
                    <BNavItem :to="{ name: 'showcase' }">Showcase</BNavItem>
                    <BNavItem :to="{ name: 'reproduce' }">Reproduce</BNavItem>
                    <BNavItem :to="{ name: 'wizard' }">Wizard</BNavItem>
                </BNavbarNav>
            </BCollapse>
        </BNavbar>
    </header>
    <main>
        <BApp> <RouterView /> </BApp>
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
} from 'bootstrap-vue-next';
import { useRoute } from 'vue-router';
</script>

<style scoped></style>
