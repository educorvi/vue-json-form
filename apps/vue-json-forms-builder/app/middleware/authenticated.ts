export default defineNuxtRouteMiddleware(() => {
    const { loggedIn } = useUserSession();

    // Send unauthenticated visitors to the login page (not the landing page — bouncing to `/` looked like a broken login).
    if (!loggedIn.value) {
        return navigateTo('/login');
    }

    // if (loggedIn.value && useRoute().path === '/') {
    //     return navigateTo('/dashboard');
    // }
});
