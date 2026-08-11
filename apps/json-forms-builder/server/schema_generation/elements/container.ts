import { z } from "zod";
import type { Control, JSONSchema, Layout as UiLayout } from '@educorvi/vue-json-form-schemas';
import { BaseDataElement, BaseDataElementOptionalKeys } from "./form-element";
import type { SchemaGenerator } from "./schema-generator";
import { Layout as Layout, getBaseJsonSchema } from "../utils";
import { Entity, PartialBy } from "./base";
import { createShowOnProperty } from "./children-schema-utils";


type ContainerElementData = z.infer<typeof ContainerElement.schema>;
const containerElementDefaults = {children: [], layout: Layout.Vertical, showTitle: true};
type ContainerElementOptionalKeys = keyof typeof containerElementDefaults | BaseDataElementOptionalKeys;
export abstract class ContainerElement extends BaseDataElement {
    data: ContainerElementData;

    static schema = BaseDataElement.schema.extend({
        // type: z.literal("array").or(z.literal("object")),
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

    get type(): "array" | "object" {
        return "array"; // TODO overriden in subclasses?
    }

    // e.g. ["properties"] or ["properties", "items"]
    abstract getScopePart(): string[];

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        scope = [...scope, this.id];
        const uiSchema: Control = {
            "type": "Control",
            "scope": scope.join("/"),
        }

        const options = super.getUiSchemaOptions();
        if (this.showTitle === false) {
            options["label"] = false;
        }
        if (Object.keys(options).length > 0) {
            uiSchema.options = options;
        }

        const showOn = createShowOnProperty(this.dependencyGroup, generator, scope);
        if (showOn) {
            uiSchema.showOn = showOn;
        }

        if (this.children && this.children.length > 0) {
            uiSchema.options = {
                ... uiSchema.options,
                "uiSchema": {
                    "type": this.layout as UiLayout["type"],
                    "elements": generator.generateUiSchemaForElements(this.children, scope.concat(this.getScopePart()))
                }
            }
        }

        return uiSchema;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema: JSONSchema = getBaseJsonSchema(this.type, this.title, this.description);

        if (this.dependencyGroup) {
            generator.addLastDependencyGroupId(this.dependencyGroup);
        }
        const lastDependencyGroup = generator.getLastDependencyGroup();
        if (lastDependencyGroup) {
            lastDependencyGroup.toJsonSchema(generator, [...scope, this.id]);
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

    getScopePart(): string[] {
        return ["items", "properties"];
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const jsonSchema: any = super.toJsonSchema(generator, scope);
        jsonSchema.items = {
            "type": "object",
            "properties": jsonSchema.properties
        }
        delete jsonSchema.properties;
        jsonSchema.type = "array";

        if (this.required) {
            jsonSchema['minItems'] = 1;
        }
        if (this.minItems !== undefined) {
            jsonSchema['minItems'] = this.minItems;
        }
        if (this.maxItems !== undefined) {
            jsonSchema['maxItems'] = this.maxItems;
        }
        return jsonSchema;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        let uiSchema = super.toUiSchema(generator, scope);
        if (this.buttonLabel) {
            uiSchema["options"] = uiSchema["options"] || {};
            uiSchema["options"]["addButtonText"] = this.buttonLabel;
        }
        return uiSchema;
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

    getScopePart(): string[] {
        return ["properties"];
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

