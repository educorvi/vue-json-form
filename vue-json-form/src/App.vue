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
} from 'bootstrap-vue-next';
import { useRoute } from 'vue-router';
import json from '@/exampleSchemas/reproduce/schema.json';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents.ts';
import ui from '@/exampleSchemas/reproduce/ui.json';
import { AjvValidator } from '@educorvi/vue-json-form-ajv-validator';
import { IfThenElseMapper } from '@/Mappers';
import { VueJsonForm } from '@/main.ts';
</script>

<style scoped></style>
