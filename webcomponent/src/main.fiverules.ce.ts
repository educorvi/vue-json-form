import { defineCustomElement } from 'vue';
import Webcomponent from './Webcomponent.fiverules.ce.vue';

const VueJsonForm = defineCustomElement(Webcomponent);
customElements.define('vue-json-form', VueJsonForm)