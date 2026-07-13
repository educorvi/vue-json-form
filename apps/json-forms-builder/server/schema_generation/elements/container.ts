import { z } from "zod";
import type { Control, JSONSchema, Layout as UiLayout } from '@educorvi/vue-json-form-schemas';
import { BaseDataElement, FormElement, DependencyGroup } from "./base";
import { StringElement } from "./string";
import { NumberElement } from "./number";
import { HTMLElement } from "./html";
import { getObjectJsonSchema, childrenToUiSchema } from "./childrenSchemaUtils";
import { Layout as Layout, getBaseJsonSchema } from "../utils";

export abstract class ContainerElement extends BaseDataElement {
    readonly type!: "array" | "object";
    format!: Layout;
    children!: FormElement[];

    static schema = BaseDataElement.schema.extend({
        children: z.lazy((): z.ZodType<any[]> => z.array(z.union([
            ArrayElement.schema,
            ObjectElement.schema,
            StringElement.schema,
            NumberElement.schema,
            HTMLElement.schema
        ])))
    });

    constructor(title: string, description?: string, format: Layout = Layout.Vertical, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, dependencyGroup, id);
        this.format = format;
        this.children = [];
    }

    // e.g. /properties/ or /properties/items/
    abstract getScopePart(): string

    toUiSchema(scope: string): Control {
        scope = scope + this.getID()
        const uiSchema: Control = {
            "type": "Control",
            "scope": scope,
        }

        if (this.children && this.children.length > 0) {
            uiSchema.options = {
                "uiSchema": {
                    "type": this.format as UiLayout["type"],
                    "elements": childrenToUiSchema(scope + this.getScopePart(), this.children)
                }
            }
        }
        return uiSchema;
    }

    toJsonSchema(): JSONSchema {
        return getObjectJsonSchema(this.title, this.children, this.description);
    }
}


export class ArrayElement extends ContainerElement {
    readonly type = "array";

    buttonLabel?: string;
    required!: boolean;
    minItems?: number;

    // more attributes
    static schema = ContainerElement.schema.extend({
        type: z.literal("array"),
        buttonLabel: z.string().optional()
    });

    constructor(title: string, description?: string, required: boolean = false, buttonLabel?: string, minItems?: number, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, dependencyGroup, id);
        this.required = required;
        this.buttonLabel = buttonLabel;
        this.minItems = minItems;
        // if (this.minItems > 0) {
        //     this.required = true;
        // } // TODO discuss (to be inserted in the future) if minItems > 0, then required should be true
    }

    getScopePart(): string {
        return "/items/properties/";
    }

    toJsonSchema(): JSONSchema {
        const jsonSchema: any = super.toJsonSchema();
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
        return jsonSchema;
    }

    toUiSchema(scope: string): Control {
        let uiSchema = super.toUiSchema(scope);
        if (this.buttonLabel) {
            uiSchema["options"] = uiSchema["options"] || {};
            uiSchema["options"]["addButtonText"] = this.buttonLabel;
        }
        return uiSchema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: Control, required: boolean=false): ArrayElement {
        const arrayElement = new ArrayElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description, required, uiSchema.options?.addButtonText, jsonSchema.minItems);
        return arrayElement;
    }
}


export class ObjectElement extends ContainerElement {
    readonly type = "object";

    static schema = ContainerElement.schema.extend({
        type: z.literal("object")
    });

    constructor(title: string, description?: string, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, dependencyGroup, id);
    }

    getScopePart(): string {
        return "/properties/";
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: Control): ObjectElement {
        const objectElement = new ObjectElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description);
        return objectElement;
    }
}

