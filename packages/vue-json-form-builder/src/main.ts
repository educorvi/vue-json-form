import './assets/main.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import VueJsonFormBuilder from './App.vue';
export { VueJsonFormBuilder };
export default VueJsonFormBuilder;

// Public types for consumers (e.g. the webcomponent wrapper)
export type {
    CollabConfig,
    CollabErrorReason,
    CollabStatus,
    CollabUser,
    FormBuilder,
} from './useFormBuilder';
export type {
    AuthResult,
    BackendAuthUser,
    BuilderAuthMode,
    KeycloakAuthConfig,
} from './composables/useBuilderAuth';
