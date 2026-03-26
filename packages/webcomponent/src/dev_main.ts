import { createApp, defineCustomElement } from 'vue';
import { createPinia } from 'pinia';
import DevApp from './DevApp.vue';

import '@educorvi/vue-json-form/dist/vue-json-form.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import shadowBootstrapStyles from './shadowDomBootstrap.scss?inline';
import jsonFormStyles from '@educorvi/vue-json-form/dist/vue-json-form.css?inline';

import DefaultWC from './Webcomponent.ce.vue';
import AjvWC from './Webcomponent.AjvValidator.ce.vue';
import ShadowWC from './Webcomponent.ShadowDom.ce.vue';

const pinia = createPinia();

customElements.define(
    'vjf-default',
    defineCustomElement(DefaultWC, {
        shadowRoot: false,
        configureApp(app) {
            app.use(pinia);
        },
    })
);

customElements.define(
    'vjf-ajv',
    defineCustomElement(AjvWC, {
        shadowRoot: false,
        configureApp(app) {
            app.use(pinia);
        },
    })
);

customElements.define(
    'vjf-shadow',
    defineCustomElement(ShadowWC, {
        shadowRoot: true,
        styles: [shadowBootstrapStyles, jsonFormStyles],
        configureApp(app) {
            app.use(pinia);
        },
    })
);

const app = createApp(DevApp);
app.use(pinia);
app.mount('#app');
