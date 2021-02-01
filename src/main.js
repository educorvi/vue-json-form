import Vue from 'vue'
import App from './App.vue'
import { BootstrapVue, BIcon, BIconX, BIconPlus, BIconGripVertical } from 'bootstrap-vue'
import {MdSteppers, MdButton} from "vue-material/dist/components"
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'


Vue.use(BootstrapVue);
Vue.component("BIcon", BIcon);
Vue.component("BIconX", BIconX);
Vue.component("BIconPlus", BIconPlus);
Vue.component("BIconGripVertical", BIconGripVertical);
import './styles.scss'

Vue.use(MdSteppers);
Vue.use(MdButton);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
