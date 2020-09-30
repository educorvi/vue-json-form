import pointer from "json-pointer";

export default {
    props: {
        //The form's UI-Schema
        ui: {
            type: [Object, Array]
        },
        //The form's JSON-Schema
        json: {
            type: Object
        }
    },
    computed: {
        jsonPath() {
            return this.ui.scope.substring(1, this.ui.scope.length)
        },
        item() {
            return pointer.get(this.json, this.jsonPath);
        },
        fallbackTitle() {
            const path = pointer.parse(this.jsonPath);
            return path[path.length-1]
        }
    },
}