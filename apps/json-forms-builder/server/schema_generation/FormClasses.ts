import { Layouts, StringFormats, BooleanFormats, EnumFormats, HttpsMethods, ButtonSubmitActions, ButtonVariants, ModalSizes, FileTypes, DependencyTypes, DependencyRelation, NumberFormats } from './FormEntityEnums';

// to save in db, use JSON.stringify() and JSON.parse() to convert to/from string
// to create object out of schema from JSON.parse() use the provided methods in the classes
import type {
    Control,
    Layout,
    Options,
    ShowOnProperty,
    LegacyShowOnProperty,
    Button as VJFButton,
    HTMLRenderer,
    Divider,
    JSONSchema,
    Buttongroup,
    Wizard,
    DescendantControlOverride,
    DescendantControlOverrides,
    UISchema
} from '@educorvi/vue-json-form-schemas';

import { boolean, z } from "zod";

abstract class Entity {
    id!: string;

    // more attributes
    static schema = z.object({
        id: z.string()
    });

    constructor(id: string) {
        this.id = id;
    }

    getID(): string {
        return this.id;
    }
}

export class DependencyGroup extends Entity {
    // attributes
    static schema = Entity.schema.extend({});
}

export abstract class FormElement extends Entity {
    dependencyGroup?: DependencyGroup;

    static schema = Entity.schema.extend({
        dependencyGroup: DependencyGroup.schema.optional()
    });

    constructor(id: string, dependencyGroup?: DependencyGroup) {
        super(id);
        this.dependencyGroup = dependencyGroup;
    }

    abstract toUiSchema(scope: string): any;

    abstract toJsonSchema(): any;

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: UISchema | Control | HTMLRenderer): FormElement {
        throw new Error("fromJsonSchemaAndUiSchema must be implemented in subclasses");
    }
}

export abstract class BaseDataElement extends FormElement {
    title!: string;

    description?: string;

    // more attributes
    static schema = FormElement.schema.extend({
        title: z.string(),
        description: z.string().optional()
    });

    constructor(title: string, description?: string, dependencyGroup?: DependencyGroup, id?: string) {
        id = id === undefined ? title.toLowerCase().replace(/\s+/g, '_') : id;
        super(id, dependencyGroup);
        this.title = title;
        this.description = description;
    }

}

export abstract class SimpleElement extends BaseDataElement {
    required!: boolean;

    // more attributes
    static schema = BaseDataElement.schema.extend({
        required: z.boolean()
    });

    constructor(title: string, description?: string, required: boolean = false, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, dependencyGroup, id);
        this.required = required;
    }
}

export abstract class ContainerElement extends BaseDataElement {
    readonly type!: "array" | "object";
    children!: FormElement[];

    // more attributes
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
            uiSchema["options"]["buttonLabel"] = this.buttonLabel;
        }
        return uiSchema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: Control): ArrayElement {
        if (jsonSchema.type !== "array") {
            throw new Error("Invalid type for ArrayElement: " + jsonSchema.type);
        }
        let required = typeof jsonSchema.required === "boolean" ? jsonSchema.required : false;
        const arrayElement = new ArrayElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description, uiSchema.options?.addButtonText, required);

        // if (jsonSchema.items && typeof jsonSchema.items === "object" && !Array.isArray(jsonSchema.items)) {
        //     const items = jsonSchema.items as Exclude<typeof jsonSchema.items, readonly JSONSchema[]>;
        //     if (items.type === "object" && items.properties) {
        //         for (let key in items.properties) {
        //             let childJsonSchema = items.properties[key];
        //             let childUiSchema = uiSchema.options?.descendantControlOverrides?.[scope + this.getID() + "/properties/items/" + key] || {};
        //             let childElement: FormElement;
        //         }
        //     } else {
        //         let childJsonSchema = items;
        //         let childUiSchema = uiSchema.options?.descendantControlOverrides?.[scope + this.getID() + "/properties/items"] || {};
        //         let childElement = fromJsonSchemaAndUiSchema(childJsonSchema, childUiSchema);
        //         this.children.push(childElement);
        //     }
        // }
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
        // TODO implement
        return new ObjectElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description);
    }
}

export class StringElement extends SimpleElement {
    readonly type = "string";

    format!: StringFormats;

    // more attributes
    static schema = SimpleElement.schema.extend({
        type: z.literal("string"),
        format: z.enum(StringFormats)
    });

    constructor(title: string, description?: string, format: StringFormats = StringFormats.Text, required: boolean = false, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, required, dependencyGroup, id);
        this.format = format;
    }

    toUiSchema(scope: string): Control {
        return {
            "type": "Control",
            "scope": scope + "/properties/" + this.getID(),
            "options": {
                // possible options from attributes
            }
        };
    }

    toJsonSchema(): JSONSchema {
        let schema: any = {
            "type": "string",
            "title": this.title,
        };
        if (this.description !== undefined) {
            schema.description = this.description;
        }
        if (this.format !== undefined) {
            schema.format = this.format;
        }
        return schema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: any): StringElement {
        if (jsonSchema.type === "string") {
            let stringElement = new StringElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description);
            if (jsonSchema.format && Object.values(StringFormats as unknown as string[]).includes(jsonSchema.format)) {
                stringElement.format = jsonSchema.format as StringFormats;
            } else {
                throw new Error("Invalid format for StringElement: " + jsonSchema.format);
            }
            return stringElement;
        } else {
            throw new Error("Invalid type for StringElement: " + jsonSchema.type);
        }
    }
}

export class NumberElement extends SimpleElement {
    readonly type = "number";

    format!: NumberFormats;

    minimum?: number;

    maximum?: number;

    multipleOf?: number;

    static schema = SimpleElement.schema.extend({
        type: z.literal("number"),
        format: z.enum(NumberFormats),
        minimum: z.number().optional(),
        maximum: z.number().optional(),
        multipleOf: z.number().optional()
    });

    constructor(title: string, description?: string, format: NumberFormats = NumberFormats.Number, required: boolean = false, dependencyGroup?: DependencyGroup, id?: string) {
        super(title, description, required, dependencyGroup, id);
        this.format = format;
    }

    toUiSchema(scope: string): Control {
        return {
            "type": "Control",
            "scope": scope + "/properties/" + this.getID(),
            "options": {
                // possible options from attributes
            }
        };
    }

    toJsonSchema(): JSONSchema {
        let schema: JSONSchema = {
            "type": this.format,
            "title": this.title,
        };
        if (this.description !== undefined) {
            schema.description = this.description;
        }
        if (this.minimum !== undefined) {
            schema.minimum = this.minimum;
        }
        if (this.maximum !== undefined) {
            schema.maximum = this.maximum;
        }
        if (this.multipleOf !== undefined) {
            schema.multipleOf = this.multipleOf;
        }
        return schema;
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: Control): NumberElement {
        let numberElement = new NumberElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description);
        if ((jsonSchema.type === "number" || jsonSchema.type === "integer") && Object.values(NumberFormats as unknown as string[]).includes(jsonSchema.type)) {
            numberElement.format = jsonSchema.type as NumberFormats;
        } else {
            throw new Error("Invalid type for NumberElement: " + jsonSchema.type);
        }
        numberElement.minimum = jsonSchema.minimum;
        numberElement.maximum = jsonSchema.maximum;
        numberElement.multipleOf = jsonSchema.multipleOf;
        return numberElement;
    }

}

export class HTMLElement extends FormElement {
    readonly type = "html";

    htmlData!: string;

    static schema = FormElement.schema.extend({
        type: z.literal("html"),
        htmlData: z.string()
    });

    constructor(htmlData: string, dependencyGroup?: DependencyGroup, id?: string) {
        super(id || "html_element", dependencyGroup);
        this.htmlData = htmlData;
    }

    toUiSchema(scope: string): HTMLRenderer {
        return {
            "type": "HTML",
            "htmlData": this.htmlData
        };
    }

    toJsonSchema(): JSONSchema {
        return {};
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema={}, uiSchema: HTMLRenderer): HTMLElement {
        let htmlElement = new HTMLElement(uiSchema.htmlData);
        // TODO handle dependencyGroup if needed
        return htmlElement;
    }
}





// Registry
type FormElementConstructor = {
    new(...args: any[]): FormElement;
    schema: z.ZodTypeAny;
    fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: any): FormElement;
};

export const FormElementRegistry = new Map<string, FormElementConstructor>([
    ["array",   ArrayElement],
    ["object",  ObjectElement],
    ["string",  StringElement],
    ["number",  NumberElement],
    ["html",    HTMLElement],
]);

export function fromJson(data: string | object): FormElement {
    const json = typeof data === "string" ? JSON.parse(data) : data;
    const Ctor = FormElementRegistry.get(json.type);
    if (!Ctor) throw new Error("Unknown FormElement type: " + json.type);

    // check zod schema
    const parseResult = Ctor.schema.safeParse(json);
    if (!parseResult.success) {
        throw new Error("Invalid FormElement data: " + parseResult.error.message);
    }

    const instance = new Ctor(""); // "" satisfies HTMLElement's constructor, harmless for others
    Object.assign(instance, json);

    // Recursively hydrate children
    if (instance instanceof ContainerElement && Array.isArray(json.children)) {
        instance.children = json.children.map((child: any) => fromJson(child));
    }
    return instance;
}

// Shared helper for fromJsonSchemaAndUiSchema
function createFromSchemas(jsonSchema: JSONSchema, uiSchema: any): FormElement {
    const type = jsonSchema.type ? jsonSchema.type as string : uiSchema?.type ? uiSchema.type as string : "";
    const Ctor = FormElementRegistry.get(type);
    if (!Ctor) throw new Error("Unknown type: " + type);
    const instance = Ctor.fromJsonSchemaAndUiSchema(jsonSchema, uiSchema);
    return instance;
}
