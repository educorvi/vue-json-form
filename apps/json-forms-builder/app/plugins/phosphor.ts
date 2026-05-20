/**
 * Registers the @phosphor-icons/vue plugin globally so Phosphor icon
 * components (e.g. <PhTrash />, <PhPencil />) are available in every
 * component in the Nuxt app — matching the setup in vue-form-builder.
 */
import PhosphorVue from '@phosphor-icons/vue';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(PhosphorVue);
});
