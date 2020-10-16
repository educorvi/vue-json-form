import form from './components/FormRoot.vue';

module.exports = {
    // eslint-disable-next-line no-unused-vars
    install: function (Vue, options) {
        Vue.component('vue-json-form', form);
    }
};
