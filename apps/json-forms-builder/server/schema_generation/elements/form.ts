import { Entity } from "./base";
import { FormElement } from "./form-element";
import { readonly, z } from "zod";
import type { PartialBy } from "./base";
import type { JSONSchema, UISchema } from '@educorvi/vue-json-form-schemas';
import { Layout } from "../utils";
import type { SchemaGenerator } from "./schema-generator";
import type { EntityOptionalKeys } from "./base";


type FormData = z.infer<typeof Form.schema>;
const formDefaults = {type: "form" as const, children: [], layout: Layout.Vertical};
type FormOptionalKeys = keyof typeof formDefaults | EntityOptionalKeys;
export class Form extends Entity {
    data: FormData;

    static schema = super.schema.extend({
        type: z.literal("form"),
        // title: z.string(),
        // description: z.string().optional(),
        layout: z.enum(Layout),
        children: z.array(z.string()),
    });

    constructor(
        data: PartialBy<FormData, FormOptionalKeys>
    ) {
        super(data);
        this.data = Form.setDefaults(data);
    }

    protected static setDefaults(data: PartialBy<FormData, FormOptionalKeys>): FormData {
        return {
            ...super.setDefaults(data),
            ...formDefaults,
            ...data,
        };
    }

    get children(): string[] {
        return this.data.children;
    }

    // get title(): string {
    //     return this.data.title;
    // }

    getScopePart(): string[] {
        return ["properties"];
    }

    toJSON(): FormData {
        return this.data;
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
