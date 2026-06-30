export default defineNuxtRouteMiddleware(() => {
    const { loggedIn } = useUserSession();

    if (!loggedIn.value) {
        return navigateTo('/');
    }

    // if (loggedIn.value && useRoute().path === '/') {
    //     return navigateTo('/dashboard');
    // }
});
