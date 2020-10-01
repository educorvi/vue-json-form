import pointer from "json-pointer";

export default {
    data() {
        return {
            fieldData: null
        }
    },
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
            return this.ui.scope.replace(/#/g, "");
        },
        item() {
            return pointer.get(this.json, this.jsonPath);
        },
        title() {
            return (this.item.title || this.schemaName).concat(this.required ? "*" : "");
        },
        schemaName() {
            const path = pointer.parse(this.jsonPath);
            return path[path.length - 1]
        },
        required() {
            return this.json.required.includes(this.schemaName)
        }
    },
    methods: {
        loopUp(data) {
            this.fieldData = data;
            // this.$emit("changedData", data)
        },
        send(data) {
            this.$emit("changedData", {key: this.schemaName, value: data})
        },
        hasSlot (name = 'default') {
            return !!this.$slots[ name ] || !!this.$scopedSlots[ name ];
        }
    },
    watch: {
        fieldData(newValue) {
            this.send(newValue)
        }
    },
    created() {
        this.fieldData = this.item.default;
    }
}
