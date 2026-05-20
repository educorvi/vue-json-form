import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// @pinia/nuxt exposes the pinia instance as $pinia on the nuxt app.
// Register pinia-plugin-persistedstate here so the form builder's store
// can persist rootLayout + jsonSchema across page refreshes.
export default defineNuxtPlugin(({ $pinia }) => {
    ($pinia as ReturnType<typeof import('pinia').createPinia>).use(
        piniaPluginPersistedstate
    );
});
