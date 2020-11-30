const props = {
    //The form's UI-Schema
    ui: {
        type: [Object, Array]
    },
    //The form's JSON-Schema
    json: {
        type: Object
    }
}

const methods = {
    loopUp(data) {
        this.$emit("changedData", data)
    },
}

export const onlyProps = {
    props: {
        ...props,
        //The current data of the form
        filledData: {
            type: Object,
            required: false
        }
    }
}
export const rootProps = {props}
export const onlyMethods = {methods}

//@group Layouts
/**
 * Mixin for all layout components
 */
export default {
    ...onlyProps,
    methods,
    components: {
        FormWrap: () => import('../FormWrap.vue'),
        HorizontalLayout: () => import('./HorizontalLayout.vue'),
        VerticalLayout: () => import('./VerticalLayout.vue'),
        Group: () => import('./Group.vue'),
    },
}
