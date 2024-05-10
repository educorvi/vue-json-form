import { defineCustomElement } from 'vue';
import Webcomponent from './Webcomponent.vue';

const VueJsonForm = defineCustomElement(Webcomponent);
customElements.define('vue-json-form', VueJsonForm)