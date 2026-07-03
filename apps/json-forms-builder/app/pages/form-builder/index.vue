<script setup lang="ts">
definePageMeta({ middleware: ['authenticated'], layout: 'base-layout' });
// import { useTodoStore } from '@/store/todo';
import FormBuilderApp from '@educorvi/vue-json-form-builder/src/App.vue';

// const store = useTodoStore();
// store.addTodo({ text: 'Test todo', id: '5', done: false, important: false });
// store.addTodo({ text: 'Test todo', id: '5', done: false, important: false });
// store.addTodo({ text: 'Test todo', id: '5', done: false, important: false });
</script>

<template>
    <div class="h-100 overflow-hidden">
        <FormBuilderApp />
        <!-- <div>{{ store.todos }}</div>
        <div>Hallo</div> -->
    </div>
</template>

<style scoped>
:deep(.relative.flex.h-screen) {
    height: 100%;
}
</style>
