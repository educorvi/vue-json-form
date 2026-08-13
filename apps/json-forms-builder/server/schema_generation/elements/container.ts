import { z } from "zod";
import type { Control, JSONSchema, Layout as UiLayout } from '@educorvi/vue-json-form-schemas';
import { BaseDataElement, BaseDataElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { cleanUiSchema, Layout } from "../utils";
import { PartialBy } from "./base";


type ContainerElementData = z.infer<typeof ContainerElement.schema>;
const containerElementDefaults = {children: [], layout: Layout.Vertical, showTitle: true};
type ContainerElementOptionalKeys = keyof typeof containerElementDefaults | BaseDataElementOptionalKeys;
export abstract class ContainerElement extends BaseDataElement {
    data: ContainerElementData;

    static schema = BaseDataElement.schema.extend({
        children: z.array(z.string()),
        layout: z.enum(Layout),
        showTitle: z.boolean()
    });

    constructor(
        data: PartialBy<ContainerElementData, ContainerElementOptionalKeys>
    ) {
        super(data);
        this.data = ContainerElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<ContainerElementData, ContainerElementOptionalKeys>): ContainerElementData {
        return {
            ...super.setDefaults(data),
            ...containerElementDefaults,
            children: [...containerElementDefaults.children], // clone so that each instance has its own array
            ...data,
        };
    }

    get children(): string[] {
        return this.data.children;
    }

    get layout(): Layout {
        return this.data.layout;
    }

    get showTitle(): boolean {
        return this.data.showTitle;
    }

    abstract get type(): "array" | "object";

    // e.g. ["properties"] or ["properties", "items"]
    abstract getScopePart(): string[];

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const uiSchema = super.toUiSchema(generator, scope);

        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.showTitle === false && { label: false }),
        }

        if (this.children && this.children.length > 0) {
            const newScope = [...scope, this.id, ...this.getScopePart()];
            uiSchema.options = {
                ...uiSchema.options,
                "uiSchema": {
                    "type": this.layout,
                    "elements": generator.generateUiSchemaForElements(this.children, newScope)
                }
            }
        }

        return uiSchema;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema = {
            ...super.toJsonSchema(generator, scope),
            "type": this.type,
        };

        if (this.dependencyGroup) {
            generator.addLastDependencyGroupId(this.dependencyGroup);
        }

        if (this.children && this.children.length > 0) {
            const { childrenJsonSchema, requiredList } = generator.generateJsonSchemaForElements(this.children, scope.concat(this.getScopePart()));
            jsonSchema.properties = childrenJsonSchema;
            if (requiredList.length > 0) {
                jsonSchema.required = requiredList;
            }
        }

        if (this.dependencyGroup) {
            generator.removeLastDependencyGroupId();
        }

        return jsonSchema;
    }
}



type ArrayElementData = z.infer<typeof ArrayElement.schema>;
const arrayElementDefaults = {required: false, type: "array" as const};
type ArrayElementOptionalKeys = keyof typeof arrayElementDefaults | ContainerElementOptionalKeys;
export class ArrayElement extends ContainerElement {
    data: ArrayElementData;

    // more attributes
    static schema = ContainerElement.schema.extend({
        type: z.literal("array"),
        required: z.boolean(),
        buttonLabel: z.string().optional(),
        minItems: z.number().int().nonnegative().optional(),
        maxItems: z.number().int().nonnegative().optional()
    });

    constructor(
        data: Omit<PartialBy<ArrayElementData, ArrayElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = ArrayElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<ArrayElementData, ArrayElementOptionalKeys>): ArrayElementData {
        return {
            ...super.setDefaults(data),
            ...arrayElementDefaults,
            ...data,
        };
    }

    get required(): boolean {
        return this.data.required;
    }

    get buttonLabel(): string | undefined {
        return this.data.buttonLabel;
    }

    get minItems(): number | undefined {
        return this.data.minItems;
    }

    get maxItems(): number | undefined {
        return this.data.maxItems;
    }

    get type(): "array" {
        return this.data.type;
    }

    getScopePart(): string[] {
        return ["items", "properties"];
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const uiSchema = super.toUiSchema(generator, scope);
        uiSchema.options = {
            ...(uiSchema.options && { ...uiSchema.options }),
            ...(this.buttonLabel && { addButtonText: this.buttonLabel }),
        }
        cleanUiSchema(uiSchema);
        return uiSchema;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema = {
            ...super.toJsonSchema(generator, scope),
            "type": this.type,
            ...(this.minItems !== undefined && { minItems: this.minItems }),
            ...(this.maxItems !== undefined && { maxItems: this.maxItems }),
        };
        jsonSchema.items = {
            "type": "object",
            "properties": jsonSchema.properties
        }
        delete jsonSchema.properties;
        jsonSchema.type = "array";

        if (this.required) {
            jsonSchema.minItems = Math.max(1, this.minItems ?? 0);
        }

        return jsonSchema;
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema, uiSchema: Control, required: boolean=false): ArrayElement {
        const layout = uiSchema.options?.uiSchema?.type ? uiSchema.options.uiSchema.type as Layout : Layout.Vertical;
        const arrayElement = new ArrayElement(
            {
                id: id,
                title: jsonSchema.title ? jsonSchema.title : "",
                hidden: false, // TODO change
                description: jsonSchema.description,
                required: required,
                layout: layout,
                buttonLabel: uiSchema.options?.addButtonText,
                minItems: jsonSchema.minItems,
                maxItems: jsonSchema.maxItems
            }
        );
        return arrayElement;
    }
}


type ObjectElementData = z.infer<typeof ObjectElement.schema>;
const objectElementDefaults = {type: "object" as const};
type ObjectElementOptionalKeys = keyof typeof objectElementDefaults | ContainerElementOptionalKeys;
export class ObjectElement extends ContainerElement {
    data: ObjectElementData;

    static schema = ContainerElement.schema.extend({
        type: z.literal("object")
    });

    constructor(
        data: Omit<PartialBy<ObjectElementData, ObjectElementOptionalKeys>, "type">
    ) {
        super(data);
        this.data = ObjectElement.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<ObjectElementData, ObjectElementOptionalKeys>): ObjectElementData {
        return {
            ...super.setDefaults(data),
            ...objectElementDefaults,
            ...data,
        };
    }

    get type(): "object" {
        return this.data.type;
    }

    getScopePart(): string[] {
        return ["properties"];
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        const uiSchema = super.toUiSchema(generator, scope);
        cleanUiSchema(uiSchema);
        return uiSchema;
    }

    static fromJsonSchemaAndUiSchema(id: string, jsonSchema: JSONSchema, uiSchema: Control): ObjectElement {
        const layout = uiSchema.options?.uiSchema?.type ? uiSchema.options.uiSchema.type as Layout : Layout.Vertical;
        const objectElement = new ObjectElement(
            {
                id: id,
                title: jsonSchema.title ? jsonSchema.title : "",
                description: jsonSchema.description,
                layout: layout,
                hidden: false, // TODO change
            }
        );
        return objectElement;
    }
}

