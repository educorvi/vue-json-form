<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import { ref } from 'vue';
import VueJsonPretty from 'vue-json-pretty';

const show = ref(false);
const modalData = ref({
    title: '',
    json: null as Record<any, any> | null,
});

function viewCode(title: string, code: Record<string, any>) {
    modalData.value = {
        title: title,
        json: code,
    };
    show.value = true;
}
</script>

<template>
    <header>
        <navbar />
    </header>

    <div id="content">
        <main>
            <RouterView @viewCode="viewCode" />
        </main>
    </div>

    <BModal
        v-if="modalData.json"
        v-model="show"
        :title="modalData.title"
        scrollable
        centered
        hideFooter
        size="lg">
        <vue-json-pretty :data="modalData.json" />
    </BModal>
</template>

<style scoped>
#content {
    margin: 20px;
    display: flex;
    justify-content: center;
}

#content > * {
    width: 100%;
    max-width: 800px;
}
</style>
