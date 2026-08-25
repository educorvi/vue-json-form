<script setup lang="ts">
import Header from './header.vue';
// import Footer from './footer.vue';
</script>

<template>
    <div class="d-flex flex-column vh-100 bg-body-tertiary">
        <Header />
        <main class="d-flex flex-column flex-grow-1 overflow-y-auto">
            <slot />
        </main>
        <!-- <Footer /> -->
    </div>
</template>
