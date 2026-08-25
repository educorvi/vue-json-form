import { z } from 'zod';
import { Entity, EntityOptionalKeys, PartialBy } from './base';
import type { SchemaGenerator } from './schema-generator';
import type {
    JSONSchema,
    ShowOnProperty,
    Formula,
} from '@educorvi/vue-json-form-schemas';

export enum DependencyType {
    greaterThan = 'greaterThan',
    lessThan = 'lessThan',
    equalTo = 'equalTo',
    notEqualTo = 'notEqualTo',
    greaterThanOrEqualTo = 'greaterThanOrEqualTo',
    lessThanOrEqualTo = 'lessThanOrEqualTo',
    minLengthOf = 'minLengthOf',
    maxLengthOf = 'maxLengthOf',
    contains = 'contains',
    notContains = 'notContains',
    startsWith = 'startsWith',
    endsWith = 'endsWith',
    isEmpty = 'isEmpty',
    isNotEmpty = 'isNotEmpty',
}

export enum DependencyRelation {
    AND = 'AND',
    OR = 'OR',
}

type DependencyData = z.infer<typeof Dependency.schema>;

/**
 * A single condition: the element with `sourceId` must satisfy `value` /
 * `dependencyType` so that the dependent (target) element is shown.
 *
 * Dependencies are first-class entities, exactly like elements and
 * dependency groups: every dependency has a uid, lives in the flat
 * "dependencies" set and is referenced by DependencyGroups via uid lists.
 */
export class Dependency extends Entity {
    data: DependencyData;

    static schema = super.schema.extend({
        sourceId: z.string(), // on which element the target depends
        dependencyType: z.enum(DependencyType),
        value: z.union([z.string(), z.number(), z.boolean()]), // the value to compare to, e.g. for "greaterThan", the value that the source should be greater than; for "contains", the value that should be contained in the source; etc.
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

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        void generator;
        void scope;
        return {}; // TODO
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Formula {
        void generator;
        return {
            type: 'atom',
            path: scope.join('/') + '/' + this.id,
        };
    }
}

type DependencyGroupData = z.infer<typeof DependencyGroup.schema>;
const dependencyGroupDefaults = { dependencies: [] as string[] };
type DependencyGroupOptionalKeys =
    keyof typeof dependencyGroupDefaults | EntityOptionalKeys;

/**
 * A group of dependencies combined with AND/OR. May contain nested groups.
 * `dependencies` holds the uids of Dependency and DependencyGroup entities
 * (in the flat "dependencies" set) — the dependency tree, exactly like the
 * element tree. In the final json/ui schema a flat list of all dependencies
 * (combined with the specified relations) is generated.
 *
 * DependencyGroups are first-class entities, exactly like form elements:
 * every group has a uid, lives in the flat "dependencies" set, and nests
 * other groups by uid. FormDefinition keeps a dependencyIndex +
 * dependencyParentIndex + elementDependencyGraph for it, and the Yjs
 * adapter stores every Dependency / DependencyGroup as its own Y.Map.
 */
export class DependencyGroup extends Entity {
    data: DependencyGroupData;

    static schema = super.schema.extend({
        // uids of Dependency and nested DependencyGroup entities
        dependencies: z.array(z.string()),
        relation: z.enum(DependencyRelation), // "AND" or "OR"
    });

    constructor(
        data: PartialBy<DependencyGroupData, DependencyGroupOptionalKeys>
    ) {
        super(data);
        this.data = {
            ...DependencyGroup.setDefaults(data),
            // dependencies must never be a shared array — every group gets its own
            dependencies: data.dependencies ? [...data.dependencies] : [],
            ...data,
        };
    }

    protected static setDefaults(
        data: PartialBy<DependencyGroupData, DependencyGroupOptionalKeys>
    ): DependencyGroupData {
        return {
            ...super.setDefaults(data),
            ...dependencyGroupDefaults,
            ...data,
        };
    }

    /** Uids of Dependency / DependencyGroup entities (the dependency tree). */
    get dependencies(): string[] {
        return this.data.dependencies;
    }

    get relation(): DependencyRelation {
        return this.data.relation;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        void generator;
        void scope;
        return {
            // TODO: implement dependency group logic
            // generate allOf and save to allof in generator. scope is the path to the element that should be shown/not shown
        };
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): ShowOnProperty {
        void generator;
        const emptyShowOn: ShowOnProperty = {
            showOn: {
                allOf: [],
            },
            rule: {
                type: 'atom',
                path: scope.join('/') + '/' + this.id,
            },
            id: this.id,
            path: scope,
        };
        return emptyShowOn;
    }
}
