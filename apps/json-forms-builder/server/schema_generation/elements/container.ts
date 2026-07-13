import { z } from "zod";
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { BaseDataElement, FormElement, DependencyGroup } from "../base";
import { StringElement } from "./string";
import { NumberElement } from "./number";
import { HTMLElement } from "./html";



export abstract class ContainerElement extends BaseDataElement {
    readonly type!: "array" | "object";
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

    constructor(title: string, description?: string, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, dependencyGroup, id);
        this.children = [];
    }

    // e.g. /properties/ or /properties/items/
    abstract getScopePart(): string

    toUiSchema(scope: string): Control {
        let objectScope = scope + this.getID();
        let uiSchema: any = {
            "type": "Control",
            "scope": objectScope,
        };
        objectScope = objectScope + this.getScopePart();

        if (this.children && this.children.length > 0) {
            uiSchema["options"] = uiSchema["options"] || {};
            uiSchema["options"]["descendantControlOverrides"] = {};
            for (let child of this.children) {
                const childUiSchema = child.toUiSchema(objectScope);
                if (childUiSchema && "options" in childUiSchema && Object.keys(childUiSchema["options"]).length > 0) {
                    let childOverrides: any = {}
                    if ("options" in childUiSchema) {
                        if ("descendantControlOverrides" in childUiSchema["options"]) {
                            uiSchema["options"]["descendantControlOverrides"] = {
                                ...uiSchema["options"]["descendantControlOverrides"],
                                ...childUiSchema["options"]["descendantControlOverrides"]
                            };
                            delete childUiSchema["options"]["descendantControlOverrides"];
                        }
                        if (Object.keys(childUiSchema["options"]).length > 0) {
                            childOverrides["options"] = childUiSchema["options"];
                        }
                    }
                    if ("showOn" in childUiSchema) {
                        childOverrides["showOn"] = childUiSchema["showOn"];
                    }
                    if (Object.keys(childOverrides).length > 0) {
                        const childScope = objectScope + child.getID();
                        uiSchema["options"]["descendantControlOverrides"][childScope] = childOverrides;
                    }
                }
            }
        }
        return uiSchema;
    }

    toJsonSchema(): JSONSchema {
        let schema: any = {
            "type": this.type,
            "title": this.title,
        }
        if (this.description !== undefined) {
            schema.description = this.description;
        }
        if (this.children && this.children.length > 0) {
            if (this.getScopePart() === "/properties/items/") {
                schema.items = {};
                if (this.children.length === 1 && this.children[0] instanceof FormElement) {
                    schema.items = this.children[0].toJsonSchema();
                } else {
                    schema.items = {
                        "type": "object",
                        "properties": {}
                    };
                    for (let child of this.children) {
                        schema.items.properties[child.getID()] = child.toJsonSchema();
                    }
                }
            } else {
                schema.properties = {};
                for (let child of this.children) {
                    schema.properties[child.getID()] = child.toJsonSchema();
                }
            }
        }
        return schema;
    }
}


export class ArrayElement extends ContainerElement {
    readonly type = "array";

    buttonLabel?: string;
    required!: boolean;

    // more attributes
    static schema = ContainerElement.schema.extend({
        type: z.literal("array"),
        buttonLabel: z.string().optional()
    });

    constructor(title: string, description?: string, buttonLabel?: string,required: boolean = false, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, dependencyGroup, id);
        this.required = required;
        this.buttonLabel = buttonLabel;
    }

    getScopePart(): string {
        return "/properties/items/";
    }

    toUiSchema(scope: string): Control {
        let uiSchema = super.toUiSchema(scope);
        if (this.buttonLabel) {
            uiSchema["options"] = uiSchema["options"] || {};
            uiSchema["options"]["addButtonText"] = this.buttonLabel;
        }
        return uiSchema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: Control): ArrayElement {
        const arrayElement = new ArrayElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description, uiSchema.options?.addButtonText);
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

