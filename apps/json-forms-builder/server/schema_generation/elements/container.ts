import { z } from "zod";
import type { Control, JSONSchema, Layout as UiLayout } from '@educorvi/vue-json-form-schemas';
import { BaseDataElement } from "./form-element";
import { DependencyGroup } from "./dependency";
import type { SchemaGenerator } from "./schema-generator";
import { Layout as Layout, getBaseJsonSchema } from "../utils";


export abstract class ContainerElement extends BaseDataElement {
    readonly type!: "array" | "object";
    layout!: Layout;
    showTitle!: boolean;
    children!: string[];

    static schema = BaseDataElement.schema.extend({
        children: z.array(z.string()),
        layout: z.enum(Layout),
        showTitle: z.boolean()
    });

    constructor(title: string, description?: string, layout: Layout = Layout.Vertical, dependencyGroup?: DependencyGroup, id?: string, showTitle: boolean = true, tooltip?: string, hidden: boolean = false, preHtml?: string, postHtml?: string) {
        super(title, description, dependencyGroup, id, tooltip, hidden, preHtml, postHtml);
        this.layout = layout;
        this.showTitle = showTitle;
        this.children = [];
    }

    // e.g. ["properties"] or ["properties", "items"]
    abstract getScopePart(): string[];

    toUiSchema(generator: SchemaGenerator, scope: string[]): Control {
        scope = [...scope, this.getID()];
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

        if (this.dependencyGroup) {
            uiSchema.showOn = this.dependencyGroup.toUiSchema(generator, scope);
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
            generator.addLastDependencyGroup(this.dependencyGroup);
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
            generator.removeLastDependencyGroup();
        }

        return jsonSchema;
    }
}


export class ArrayElement extends ContainerElement {
    readonly type = "array";

    buttonLabel?: string;
    required!: boolean;
    minItems?: number;
    maxItems?: number;

    // more attributes
    static schema = ContainerElement.schema.extend({
        type: z.literal("array"),
        required: z.boolean(),
        buttonLabel: z.string().optional(),
        minItems: z.number().int().nonnegative().optional(),
        maxItems: z.number().int().nonnegative().optional()
    });

    constructor(
        title: string,
        description?: string,
        required: boolean = false,
        layout: Layout = Layout.Vertical,
        buttonLabel?: string,
        minItems?: number,
        maxItems?: number,
        dependencyGroup?: DependencyGroup,
        id?: string,
        showTitle: boolean = true,
        tooltip?: string,
        hidden: boolean = false,
        preHtml?: string,
        postHtml?: string
    ) {
        super(title, description, layout, dependencyGroup, id, showTitle, tooltip, hidden, preHtml, postHtml);
        this.required = required;
        this.buttonLabel = buttonLabel;
        this.minItems = minItems;
        this.maxItems = maxItems;
        // if (this.minItems > 0) {
        //     this.required = true;
        // } // TODO discuss (to be inserted in the future) if minItems > 0, then required should be true
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

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: Control, required: boolean=false): ArrayElement {
        const layout = uiSchema.options?.uiSchema?.type ? uiSchema.options.uiSchema.type as Layout : Layout.Vertical;
        const arrayElement = new ArrayElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description, required, layout, uiSchema.options?.addButtonText, jsonSchema.minItems, jsonSchema.maxItems);
        return arrayElement;
    }
}


export class ObjectElement extends ContainerElement {
    readonly type = "object";

    static schema = ContainerElement.schema.extend({
        type: z.literal("object")
    });

    constructor(
        title: string,
        description?: string,
        layout: Layout = Layout.Vertical,
        dependencyGroup?: DependencyGroup,
        id?: string,
        showTitle: boolean = true,
        tooltip?: string,
        hidden: boolean = false,
        preHtml?: string,
        postHtml?: string
    ) {
        super(title, description, layout, dependencyGroup, id, showTitle, tooltip, hidden, preHtml, postHtml);
    }

    getScopePart(): string[] {
        return ["properties"];
    }

    static fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: Control): ObjectElement {
        const layout = uiSchema.options?.uiSchema?.type ? uiSchema.options.uiSchema.type as Layout : Layout.Vertical;
        const objectElement = new ObjectElement(jsonSchema.title ? jsonSchema.title : "", jsonSchema.description, layout);
        return objectElement;
    }
}

