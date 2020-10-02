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
            function titleCase(string) {
                let sentence = string.toLowerCase().split("_");
                for (let i = 0; i < sentence.length; i++) {
                    sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
                }

                return sentence.join(" ");
            }

            return (this.item.title || titleCase(this.schemaName)).concat(this.required ? "*" : "");
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
            // this.fieldData = data;
            this.$emit("changedData", data)
        },
        send(data) {
            if (!this.isArray) {
                this.$emit("changedData", {key: this.ui.scope, value: data});
            } else {
                this.$emit("changedData", {key: this.ui.scope, value: data.map(obj => obj.value)});
            }

        },
        hasSlot(name = 'default') {
            return !!this.$slots[name] || !!this.$scopedSlots[name];
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
