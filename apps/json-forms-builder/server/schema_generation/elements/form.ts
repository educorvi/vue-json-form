import { Entity } from "./base";
import { FormElement } from "./form-element";
import { z } from "zod";
import type { JSONSchema, UISchema } from '@educorvi/vue-json-form-schemas';
import { Layout } from "../utils";
import type { SchemaGenerator } from "./schema-generator";


export class Form extends Entity {
    readonly type = "form";
    title!: string;
    description?: string;
    layout!: Layout; //TODO oder wizard??
    children!: string[];
    requiredList!: string[];

    static schema = super.schema.extend({
        title: z.string(),
        description: z.string().optional(),
        layout: z.enum(Layout),
        children: z.array(z.string()),
        requiredList: z.array(z.string())
    });

	constructor(
        title: string,
        description?: string,
        id?: string,
        layout: Layout = Layout.Vertical
    ) {
        super(id);
		this.title = title;
		this.description = description;
        this.layout = layout;
		this.children = [];
		this.requiredList = [];
	}

    getScopePart(): string {
        return "/properties/";
    }

    ///////////TODO????????
    // parse from database json
    static parse(raw: any): Form {
        const parsed = Form.schema.parse(raw);
        const form = new Form(parsed.title, parsed.description, parsed.id, parsed.layout);
        form.children = parsed.children;
        form.requiredList = parsed.requiredList;
        return form;
    }

	toUiSchema(generator: SchemaGenerator): UISchema {
        const uiSchema: UISchema = {
            "$schema": "TODO",
            "version": "2.1",
            "layout": {
                "type": this.layout,
                "elements": generator.generateUiSchemaForElements(this.children, ["properties"]),
            }
        }
		return uiSchema
	}

	toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const {childrenJsonSchema, requiredList} = generator.generateJsonSchemaForElements(this.children, ["properties"]);
        const jsonSchema: JSONSchema = {
            "$schema": "https://json-schema.org/draft/2019-09/schema#",
            "type": "object",
            "properties": childrenJsonSchema,
            "required": requiredList,
            "allOf": generator.generatorHelperAttributes.allOf
        };
        return jsonSchema;
	}
}
