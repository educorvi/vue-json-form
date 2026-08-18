import { z } from "zod";
import { Entity, EntityOptionalKeys, PartialBy } from "./base";
import type { SchemaGenerator } from "./schema-generator";
import type { JSONSchema, Formula, Macro, Atom, Comparison, Operator, UnaryOperator, NonUnaryOperator, Rule } from '@educorvi/vue-json-form-schemas';
import comparisonSchema from "@educorvi/rita/src/schema/comparison.json";
import operatorSchema from "@educorvi/rita/src/schema/operator.json";
import { SimpleElement } from "./form-element";
import { minTwoItems } from "./utils";


type DependencyTypeValue = NonNullable<Comparison["operation"]>;

const ritaOperations = comparisonSchema.properties.operation.enum as DependencyTypeValue[];

export const DependencyType = {
    ...(Object.fromEntries(ritaOperations.map(v => [v, v])) as { [K in DependencyTypeValue]: K }),
    minLength: "minLength",
    maxLength: "maxLength",
} as const;

export type DependencyType = (typeof DependencyType)[keyof typeof DependencyType];

const DependencyTypeEnumExtended = z.enum(
    Object.values(DependencyType) as [DependencyType, ...DependencyType[]]
);

type DependencyData = z.infer<typeof Dependency.schema>;
export class Dependency extends Entity{
    data: DependencyData;

    static schema = super.schema.extend({
        sourceId: z.string(), // on which element the target depends
        dependencyType: DependencyTypeEnumExtended,
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

    ritaOperation(): DependencyTypeValue {
        switch (this.dependencyType) {
            case DependencyType.minLength:
                return DependencyType.greaterOrEqual;
            case DependencyType.maxLength:
                return DependencyType.smallerOrEqual;
            default:
                return this.dependencyType;
        }
    }

    get value(): string | number | boolean {
        return this.data.value;
    }

    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        return {

        } // TODO
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Rule {
        const sourceElement = generator.document.getElementById(this.sourceId);
        if (!sourceElement) {
            throw new Error(`Source element with id ${this.sourceId} not found`);
        } else if (!(sourceElement instanceof SimpleElement)) {
            throw new Error(`Source element with id ${this.sourceId} is not a SimpleElement`);
        }

        const sourcePath = generator.getPath(this.sourceId).join("/");

        let firstArgument: Macro | Atom;
        if (this.dependencyType === DependencyType.minLength || this.dependencyType === DependencyType.maxLength) {
            firstArgument = {
                    type: "macro",
                    macro: {
                        type: "length",
                        array: {type: "atom", path: sourcePath, default: ""}
                    }
                };
        } else if (sourceElement.isCheckboxGroup){
            const placeholder = `current_option${sourcePath.replace(".", "_")}`
            firstArgument = {type: "atom", path: placeholder, default: ""};
        } else {
            firstArgument = {
                type: "atom",
                path: sourcePath,
                default: sourceElement.usesEmptyStringDefaultWhenSourceOfDependency ? "" : undefined,
            };
        }

        const comparison: Formula = {
            type: "comparison",
            operation: this.ritaOperation(),
            allowDifferentTypes: true,
            arguments: [firstArgument, this.value]
        }

        const showOn: Rule = {
            id: `rita-rule-${this.id}-${this.uid}`,
            rule: comparison
        }

        if (sourceElement.isCheckboxGroup) {
            const placeholder = `current_option${sourcePath.replace(".", "_")}`
            const checkboxGroupDependency: Formula = {
                type: "exists",
                array: {type: "atom", path: sourcePath, default: []},
                placeholder: placeholder,
                rule: comparison
            };
            showOn.rule = checkboxGroupDependency;
        }
        return showOn;
    }
}



type DependencyRelationValue = NonNullable<Operator["type"]>;
const ritaOperators = operatorSchema.oneOf.flatMap(o => o.properties.type.enum) as DependencyRelationValue[];

export const DependencyRelation = {
    ...(Object.fromEntries(ritaOperators.map(v => [v, v])) as { [K in DependencyRelationValue]: K }),
} as const;

export type DependencyRelation = (typeof DependencyRelation)[keyof typeof DependencyRelation];

const DependencyRelationEnum = z.enum(
    ritaOperators as [DependencyRelationValue, ...DependencyRelationValue[]]
);

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
        relation: DependencyRelationEnum // and, or, not
        // in the final json/ui schema: generate one list that consists of all dependencies and dependency groups (combined with the specified relation)
    });

    constructor(data: PartialBy<DependencyGroupData, DependencyGroupOptionalKeys>) {
        super(data);
        this.data = {
            ...DependencyGroup.setDefaults(data),
            dependencies: [...dependencyGroupDefaults.dependencies], // clone so that each instance has its own array
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

    get relation(): DependencyRelation {
        return this.data.relation;
    }

    // TODO vielleicht wird die methode gar nicht merh gebraucht sonsdern durch generateRules ersetzt
    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        return {
            "allOf": this.data.dependencies.map(depId => {
                const dep = generator.document.getDependency_Group(depId);
                if (!(dep instanceof Dependency || dep instanceof DependencyGroup)) {
                    throw new Error(`Dependency with id ${depId} not found or is not a Dependency element`);
                }
                return dep.toJsonSchema(generator, scope);
            })
            // TODO: implement dependency group logic
            // generate allOf and save to allof in generator. scope is the path to the element that should be shown/not shown
        };
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Rule {
        let rule: UnaryOperator | NonUnaryOperator;
        const ruleArguments: Formula[] = this.data.dependencies.map(depId => {
            const dep = generator.document.getDependency_Group(depId);
            if (dep instanceof Dependency || dep instanceof DependencyGroup) {
                const rule = dep.toUiSchema(generator, scope);
                return rule.rule;
            } else {
                throw new Error(`Dependency with id ${depId} not found or is not a Dependency(Group) element`);
            }
        });

        if (this.relation === DependencyRelationEnum.enum.not) {
            if (ruleArguments.length !== 1 || ruleArguments[0] === undefined) {
                throw new Error(`DependencyGroup with relation "NOT" must have exactly one dependency, but has ${ruleArguments.length}`);
            }

            rule = {
                type: this.relation,
                arguments: [ruleArguments[0]]
            };
        } else {
            if (!minTwoItems(ruleArguments)) {
                throw new Error(`DependencyGroup with relation "${this.relation}" must have at least two dependencies, but has ${ruleArguments.length}`);
            }
            rule = {
                type: this.relation,
                arguments: ruleArguments
            };
        }

        const showOn: Rule = {
            id: `rita-rule-${this.id}-${this.uid}`,
            rule: rule,
        };
        return showOn;
    }
}