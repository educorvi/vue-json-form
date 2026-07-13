import type { JSONSchema, UISchema } from '@educorvi/vue-json-form-schemas';
import { ArrayElement, ContainerElement } from "./elements/container";
import { FormElement } from "./base";
import { FormElementRegistry } from "./registry";


export function fromJson(data: string | object): FormElement {
    const json = typeof data === "string" ? JSON.parse(data) : data;
    const Ctor = FormElementRegistry.get(json.type);
    if (!Ctor) throw new Error("Unknown FormElement type: " + json.type);

    // check zod schema
    const parseResult = Ctor.schema.safeParse(json);
    if (!parseResult.success) {
        throw new Error("Invalid FormElement data: " + parseResult.error.message);
    }

    const instance = new Ctor("");
    Object.assign(instance, json);

    // Recursively hydrate children
    if (instance instanceof ContainerElement && Array.isArray(json.children)) {
        instance.children = json.children.map((child: any) => fromJson(child));
    }
    return instance;
}

export function fromJsonSchemaAndUiSchema(jsonSchema: JSONSchema, uiSchema: UISchema): FormElement {
    const type = jsonSchema.type ? jsonSchema.type : "object";
    if (typeof type !== "string") throw new Error("Cannot determine FormElement type from JSON Schema: " + JSON.stringify(jsonSchema));

    const Ctor = FormElementRegistry.get(type);
    if (!Ctor) throw new Error("Unknown FormElement type: " + type);

    const formElement = Ctor.fromJsonSchemaAndUiSchema(jsonSchema, uiSchema);

    // Recursively hydrate children for ContainerElements
    if (formElement instanceof ContainerElement) {
        let children_schema: JSONSchema = {};
        if (jsonSchema.properties) {
            children_schema = jsonSchema.properties;
            formElement.children = Object.keys(children_schema).map((key) => {
            const childJsonSchema: JSONSchema = children_schema[key];
            const childUiSchema = (uiSchema as any).options?.descendantControlOverrides?.[key] || {};
            return fromJsonSchemaAndUiSchema(childJsonSchema, childUiSchema);
        }).filter((child) => child !== null) as FormElement[];
        } else if (jsonSchema.items && typeof jsonSchema.items === "object") {
            children_schema = jsonSchema.items;
            formElement.children = [fromJsonSchemaAndUiSchema(children_schema, (uiSchema as any).options?.descendantControlOverrides || {})] as FormElement[];
        }
    }

    return formElement;
}