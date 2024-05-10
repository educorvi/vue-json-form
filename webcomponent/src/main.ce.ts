import { defineCustomElement } from 'vue';
import { VueJsonForm as VueJsonFormComponent } from '@educorvi/vue-json-form';

const VueJsonForm = defineCustomElement(VueJsonFormComponent);
customElements.define('vue-json-form', VueJsonForm)