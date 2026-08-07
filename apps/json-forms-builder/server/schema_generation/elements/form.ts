import { Entity } from "./base";
import { FormElement } from "./form-element";
import { z } from "zod";
import type { JSONSchema, UISchema } from '@educorvi/vue-json-form-schemas';
import { Layout } from "../utils";
import type { SchemaGenerator } from "./schema-generator";
import { da } from "zod/v4/locales";


type FormData = z.infer<typeof Form.schema>;
export class Form extends Entity {
    data: FormData;

    static schema = super.schema.extend({
        type: z.literal("form"),
        title: z.string(),
        description: z.string().optional(),
        layout: z.enum(Layout),
        children: z.array(z.string()),
    });

    constructor(
        // "children" is optional in the constructor
        data: Partial<FormData> & Omit<FormData, "children, uid, id">
    ) {
        super(data);
        this.data = {
            ...data,
            children: data.children ?? [],
        }
    }

    getScopePart(): string[] {
        return ["properties"];
    }

	toUiSchema(generator: SchemaGenerator): UISchema {
        const uiSchema: UISchema = {
            "$schema": "TODO",
            "version": "2.1",
            "layout": {
                "type": this.data.layout,
                "elements": generator.generateUiSchemaForElements(this.data.children, ["properties"]),
            }
        }
		return uiSchema
	}

	toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const {childrenJsonSchema, requiredList} = generator.generateJsonSchemaForElements(this.data.children, ["properties"]);
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
