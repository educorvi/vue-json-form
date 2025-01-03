const props = {
    //The form's UI-Schema
    ui: {
        type: [Object, Array]
    },
    //The form's JSON-Schema
    json: {
        type: Object
    },
    //The current data of the form
    filledData: {
        type: Object,
        required: false
    },
    //The ID of the form
    formID: {
        type: String,
        required: false
    }
}

const methods = {
    loopUp(data) {
        this.$emit("changedData", data)
    },
}

const computed = {
    customCss() {
        return this.ui.options?.cssClass || ''
    }
}

export const onlyProps = {
    props
}
export const rootProps = {props}
export const onlyMethods = {methods}

//@group Layouts
/**
 * Mixin for all layout components
 */
export default {
    props,
    methods,
    computed,
    components: {
        FormWrap: () => import('../FormWrap.vue'),
        HorizontalLayout: () => import('./HorizontalLayout.vue'),
        VerticalLayout: () => import('./VerticalLayout.vue'),
        Group: () => import('./Group.vue'),
    },
}
