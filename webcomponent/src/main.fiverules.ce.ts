import { defineCustomElement } from 'vue';
import Webcomponent from './Webcomponent.ce.vue';
import './fiverules_style.scss';

const VueJsonForm = defineCustomElement(Webcomponent);
customElements.define('vue-json-form', VueJsonForm)