import Form from "./webcomponent";

import {BootstrapVue, BIconX, BIconPlus, BIconGripVertical} from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import Vue from 'vue'
import vueCustomElement from 'vue-custom-element'
import 'document-register-element/build/document-register-element'

Vue.config.productionTip = false

Vue.use(vueCustomElement);

const options = {
    // shadow: true,
    // beforeCreateVueInstance(root) {
    //     const rootNode = root.el.getRootNode();
    //
    //     if (rootNode instanceof ShadowRoot) {
    //         root.shadowRoot = rootNode;
    //     } else {
    //         root.shadowRoot = document.head;
    //     }
    //     return root;
    // },
}

Vue.use(BootstrapVue);
Vue.component("BIconX", BIconX);
Vue.component("BIconPlus", BIconPlus);
Vue.component("BIconGripVertical", BIconGripVertical);
Vue.customElement('vue-json-form', Form, options)
