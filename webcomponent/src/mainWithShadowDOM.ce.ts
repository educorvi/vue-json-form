import { defineCustomElement } from "vue";
import Webcomponent from "./Webcomponent.ce.vue";
import bootstrapStyles from 'bootstrap/dist/css/bootstrap.min.css?inline';
import jsonFormStyles from "@educorvi/vue-json-form/dist/vue-json-form.css?inline";


Webcomponent.styles = [
    ...(Webcomponent.styles || []),
    bootstrapStyles,
    jsonFormStyles
];

const VueJsonForm = defineCustomElement(Webcomponent);
customElements.define("vue-json-form", VueJsonForm);
