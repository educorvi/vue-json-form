// import { createPersistedState } from 'pinia-plugin-persistedstate';

// export default defineNuxtPlugin((nuxtApp) => {
//     nuxtApp.$pinia.use(
//         createPersistedState({
//             storage: localStorage,
//         })
//     );
// });

import { createPinia } from 'pinia';

export default defineNuxtPlugin((nuxtApp) => {
    const pinia = createPinia();
    nuxtApp.vueApp.use(pinia);
});
