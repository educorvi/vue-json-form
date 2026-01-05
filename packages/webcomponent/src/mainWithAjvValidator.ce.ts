import { defineCustomElement } from "vue";
import Webcomponent from "./Webcomponent.AjvValidator.ce.vue";
import "@educorvi/vue-json-form/dist/vue-json-form.css";
const VueJsonForm = defineCustomElement(Webcomponent, {
  shadowRoot: false,
});
customElements.define("vue-json-form", VueJsonForm);
