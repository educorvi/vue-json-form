import { z } from "zod";
import { Entity, EntityOptionalKeys, PartialBy } from "./base";
import type { SchemaGenerator } from "./schema-generator";
import type { JSONSchema, ShowOnProperty } from '@educorvi/vue-json-form-schemas';

export enum DependencyType {
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

export enum DependencyRelation {
    AND = "AND",
    OR = "OR"
}

type DependencyData = z.infer<typeof Dependency.schema>;
export class Dependency extends Entity{
    data: DependencyData;

    static schema = super.schema.extend({
        sourceId: z.string(), // on which element the target depends
        dependencyType: z.enum(DependencyType),
        value: z.union([z.string(), z.number(), z.boolean()])// the value to compare to, e.g. for "greaterThan", the value that the source should be greater than; for "contains", the value that should be contained in the source; etc.
    // dependencyGroup!: DependencyGroup;
    });

    constructor(data: PartialBy<DependencyData, EntityOptionalKeys>) {
        super(data);
        this.data = {
            ...Dependency.setDefaults(data),
            ...data,
        };
    }

    get sourceId(): string {
        return this.data.sourceId;
    }

    get dependencyType(): DependencyType {
        return this.data.dependencyType;
    }

    get value(): string | number | boolean {
        return this.data.value;
    }

    toJSON(): DependencyData {
        return this.data;
    }
}

type DependencyGroupData = z.infer<typeof DependencyGroup.schema>;
const dependencyGroupDefaults = {dependencies: []};
type DependencyGroupOptionalKeys = keyof typeof dependencyGroupDefaults | EntityOptionalKeys;
export class DependencyGroup extends Entity {
    data: DependencyGroupData;

    static schema = super.schema.extend({
        dependencies: z.array(z.string()), // list of dependency ids
        // deps: z.array(Dependency.schema),
        // depGroups: z.lazy((): z.ZodType<any[]> => z.array(DependencyGroup.schema)),
        //parentDepGroup?: DependencyGroup; // the parent dependency group, if this is a nested dependency group
        relation: z.enum(DependencyRelation) // "AND" or "OR"
        // in the final json/ui schema: generate one list that consists of all dependencies and dependency groups (combined with the specified relation)
    });

    constructor(data: PartialBy<DependencyGroupData, DependencyGroupOptionalKeys>) {
        super(data);
        this.data = {
            ...DependencyGroup.setDefaults(data),
            ...data,
        };
    }

    protected static setDefaults(data: PartialBy<DependencyGroupData, DependencyGroupOptionalKeys>): DependencyGroupData {
        return {
            ...super.setDefaults(data),
            ...dependencyGroupDefaults,
            ...data,
        };
    }

    get dependencies(): string[] {
        return this.data.dependencies;
    }

    toJSON(): DependencyGroupData {
        return this.data;
    }

    // TODO vielleicht wird die methode gar nicht merh gebraucht sonsdern durch generateRules ersetzt
    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        return {
            // TODO: implement dependency group logic
            // generate allOf and save to allof in generator. scope is the path to the element that should be shown/not shown
        }
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): ShowOnProperty {
        return {
            //TODO: implement dependency group logic
        }
    }
}