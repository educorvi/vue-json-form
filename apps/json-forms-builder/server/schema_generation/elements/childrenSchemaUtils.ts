import type { JSONSchema, Control, HTMLRenderer, ShowOnProperty } from '@educorvi/vue-json-form-schemas';
import { FormElement } from './base';
import { getBaseJsonSchema } from '../utils';

function childrenToJsonSchema(children: FormElement[]): {childrenJsonSchema: JSONSchema["properties"], requiredList: string[], allOfList: JSONSchema["allOf"]} {
    const schema: JSONSchema["properties"] = {};
    const requiredList: string[] = [];
    const allOfList = [];

    for (const child of children) {
        const childId = child.getID();
        const childSchema = child.toJsonSchema();
        if (childSchema === undefined || childSchema === null || Object.keys(childSchema).length === 0) {
            continue;
        }
        schema[childId] = childSchema;

        if ((child as any).required === true) {
            requiredList.push(childId);
        }

        if (child.dependencyGroup) {
            const allOf: JSONSchema = {
                [childId]: child.dependencyGroup.toJsonSchema(),
            }
            allOfList.push({
                "properties": {
                    [childId]: allOf
                }
            });
        }
    }

    return {childrenJsonSchema: schema, requiredList: requiredList, allOfList: allOfList};
}

export function getObjectJsonSchema(title: string, children: FormElement[], description?: string): JSONSchema {
    const jsonSchema: JSONSchema = getBaseJsonSchema("object", title, description);
    if (children && children.length > 0) {
        const { childrenJsonSchema, requiredList } = childrenToJsonSchema(children);
        jsonSchema.properties = childrenJsonSchema;
        jsonSchema.required = requiredList;
    }

    return jsonSchema;
}


export function childrenToUiSchema(scope: string, children: FormElement[]): (Control | HTMLRenderer)[] {
    /*
    scope is of the structure /properties/parentId/properties/
    */
    // if (!children || children.length === 0) {
    //     return { elements: [], showOn: {} };
    // }

    const childrenUiSchemaList: (Control | HTMLRenderer)[] = children.map(child => child.toUiSchema(scope));
    return childrenUiSchemaList;
}