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

/**
 *Mixin that only uses the props
 */
export const onlyProps = {props}

/**
 * @vuese
 * Mixin for all layout components
 */
export default {
    props,
    components: {
        FormWrap: () => import('../FormWrap'),
        HorizontalLayout: () => import('./HorizontalLayout'),
        VerticalLayout: () => import('./VerticalLayout'),
        Group: () => import('./Group'),
    },
}
