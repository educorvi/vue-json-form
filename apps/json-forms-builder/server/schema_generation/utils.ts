import type { JSONSchema } from '@educorvi/vue-json-form-schemas';

export function createId(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '_');
}

export enum Layout {
    Horizontal = "HorizontalLayout",
    Vertical = "VerticalLayout",
    Group = "Group" // with line to the right of the elements
}

export function getBaseJsonSchema(type: "array" | "object", title: string, description?: string): JSONSchema {
    const schema: JSONSchema = {
        "type": type,
        "title": title,
    }
    if (description !== undefined) {
        schema.description = description;
    }
    return schema;
}
