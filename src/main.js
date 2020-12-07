import Vue from 'vue'
import App from './App.vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import {MdSteppers, MdButton} from "vue-material/dist/components"
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
import './styles.scss'

Vue.use(MdSteppers);
Vue.use(MdButton);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
