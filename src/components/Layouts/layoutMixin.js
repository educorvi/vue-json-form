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

/**
 *Mixin that only uses the props
 */
export const onlyProps = {props}
export const onlyMethods = {methods}
/**
 * @vuese
 * Mixin for all layout components
 */
export default {
    props,
    methods,
    components: {
        FormWrap: () => import('../FormWrap'),
        HorizontalLayout: () => import('./HorizontalLayout'),
        VerticalLayout: () => import('./VerticalLayout'),
        Group: () => import('./Group'),
    },
}
