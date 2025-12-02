import { defineCustomElement } from 'vue';
import Webcomponent from './Webcomponent.ShadowDom.ce.vue';
import bootstrapStyles from './shadowDomBootstrap.scss?inline';
import jsonFormStyles from '@educorvi/vue-json-form/dist/vue-json-form.css?inline';


const VueJsonForm = defineCustomElement(Webcomponent, {
    shadowRoot: true,
    styles: [
        bootstrapStyles,
        jsonFormStyles
    ],
});
customElements.define('vue-json-form', VueJsonForm);
