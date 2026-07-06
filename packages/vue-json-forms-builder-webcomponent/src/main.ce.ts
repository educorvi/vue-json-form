import { defineCustomElement } from 'vue';
import Webcomponent from '@/Webcomponent.ce.vue';
import vjfb from '@educorvi/vue-json-form-builder/dist/vue-json-form-builder.css?inline';
import bootstrapStyles from './shadowDomBootstrap.scss?inline';
import bootstrapIconsWoff from 'bootstrap-icons/font/fonts/bootstrap-icons.woff?url';
import bootstrapIconsWoff2 from 'bootstrap-icons/font/fonts/bootstrap-icons.woff2?url';

const bootstrapIconsFontFace = `
@font-face {
    font-display: block;
    font-family: "bootstrap-icons";
    src:
        url("${bootstrapIconsWoff2}") format("woff2"),
        url("${bootstrapIconsWoff}") format("woff");
}
`;

const bootstrapIconsFontStyleId = 'vue-json-form-builder-bootstrap-icons-font';

if (typeof document !== 'undefined' && !document.getElementById(bootstrapIconsFontStyleId)) {
    const style = document.createElement('style');
    style.id = bootstrapIconsFontStyleId;
    style.textContent = bootstrapIconsFontFace;
    document.head.appendChild(style);
}

const VueJsonFormsBuilder = defineCustomElement(Webcomponent, {
    shadowRoot: true,
    styles: [bootstrapStyles, vjfb],
});
customElements.define('vue-json-form-builder', VueJsonFormsBuilder);
