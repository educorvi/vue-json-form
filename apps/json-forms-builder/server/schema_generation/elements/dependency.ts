import { z } from "zod";
import { Entity } from "./base";
import type { SchemaGenerator } from "./schema-generator";
import type { JSONSchema, ShowOnProperty } from '@educorvi/vue-json-form-schemas';

enum DependencyType {
    greaterThan = "greaterThan",
    lessThan = "lessThan",
    equalTo = "equalTo",
    notEqualTo = "notEqualTo",
    greaterThanOrEqualTo = "greaterThanOrEqualTo",
    lessThanOrEqualTo = "lessThanOrEqualTo",
    minLengthOf = "minLengthOf",
    maxLengthOf = "maxLengthOf",
    contains = "contains",
    notContains = "notContains",
    startsWith = "startsWith",
    endsWith = "endsWith",
    isEmpty = "isEmpty",
    isNotEmpty = "isNotEmpty",
}

enum DependencyRelation {
    AND = "AND",
    OR = "OR"
}

export class Dependency {
    sourceId!: string; // on which element the target depends
    dependencyType!: DependencyType;
    value!: number | string | boolean; // the value to compare to, e.g. for "greaterThan", the value that the source should be greater than; for "contains", the value that should be contained in the source; etc.
    // dependencyGroup!: DependencyGroup;

    static schema = z.object({
        sourceId: z.string(),
        dependencyType: z.enum(DependencyType),
        value: z.union([z.string(), z.number(), z.boolean()])
    });
}

export class DependencyGroup extends Entity {
    deps!: Dependency[];
    depGroups!: DependencyGroup[];
    //parentDepGroup?: DependencyGroup; // the parent dependency group, if this is a nested dependency group
    relation!: DependencyRelation; // "AND" or "OR"
    // in the final json/ui schema: generate one list that consists of all dependencies and dependency groups (combined with the specified relation)

    static schema = Entity.schema.extend({
        deps: z.array(Dependency.schema),
        depGroups: z.lazy((): z.ZodType<any[]> => z.array(DependencyGroup.schema)),
        relation: z.enum(DependencyRelation)
    });


    constructor(id?: string) {
        super(id);
    }

    // TODO vielleicht wird die methode gar nicht merh gebraucht sonsdern durch generateRules ersetzt
    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        return {
            //TODO: implement dependency group logic
            // generate allOf and save to allof in generator. scope is the path to the element that should be shown/not shown
        }
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): ShowOnProperty {
        return {
            //TODO: implement dependency group logic
        }
    }
}