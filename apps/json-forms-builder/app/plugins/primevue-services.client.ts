import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import DialogService from 'primevue/dialogservice';
import Tooltip from 'primevue/tooltip';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(ConfirmationService);
    nuxtApp.vueApp.use(ToastService);
    nuxtApp.vueApp.use(DialogService);
    nuxtApp.vueApp.directive('tooltip', Tooltip);
});
