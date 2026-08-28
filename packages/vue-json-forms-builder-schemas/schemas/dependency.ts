import { z } from "zod";
import { Entity, EntityOptionalKeys, PartialBy } from "./base";
import type { SchemaGenerator } from "./schema-generator";
import type { JSONSchema, Formula, Macro, Atom, Operator, UnaryOperator, NonUnaryOperator, Rule, Quantifier } from '@educorvi/vue-json-form-schemas';
import { SimpleElement } from "./form-element";
import { assertDefined, DependencyRelation, DependencyRelationEnum, DependencyType, DependencyTypeEnumExtended, DependencyTypeValue, minTwoItems, splitScopeAt, transform_scope_to_object_writing_form } from "./utils";




function putFormulaWithinArrayRule(scope: string[], formula: Formula): Quantifier {
    let array_rule: Quantifier = {} as Quantifier;
    // split by items
    const paths: string[][] = splitScopeAt(scope, "items");

    let currentPathList: string[] = [];
    let currentDotJoinedArrayPath = "";

    let current_rule: Quantifier = {} as Quantifier;
    let current_subrule: Operator = {} as Operator;
    let counter = 1;
    // iterate through all paths except the last one, which is the actual element
    for (let i = 0; i < paths.length - 1; i++) {
        const path = paths[i];
        if (path === undefined) {
            throw new Error(`Path is undefined for scope: ${scope}`);
        }
        currentPathList = currentPathList.concat(path);

        const subRule: Operator = {
            type: DependencyRelation.and,
            arguments: [
                {
                    type: "comparison",
                    operation: DependencyType.equal,
                    arguments: [
                        {
                            type: "atom",
                            path: "$index" + counter,
                            default: -1,
                        },
                        {
                            type: "atom",
                              path: "$selfIndices./" + currentPathList.join("/"),
                            default: -1,
                        },
                    ],
                },
                { // gets replaced by the actual rule for the element at the end of the loop
                    type: "not",
                    arguments: [
                        {
                            type: "atom",
                            path: "placeholder argument",
                        }
                    ],
                }
            ],
        }

        // compute path of current array (dot-joined path since last outer array, or if outermost array, dot-joined path from root)
        if (currentDotJoinedArrayPath !== "") {
            // all inner arrays: path is $array_itemX + dot-joined path since last outer (not outermost!) array
            const index = path.lastIndexOf("properties");
            currentDotJoinedArrayPath = `$array_item${counter - 1}.${transform_scope_to_object_writing_form(path)}`;
        } else {
            // outermost array
            currentDotJoinedArrayPath = transform_scope_to_object_writing_form(currentPathList);
        }

        // create rule for current array
        const rule: Quantifier = {
            type: "exists",
            array: { type: "atom", path: currentDotJoinedArrayPath, default: [] },
            placeholder: "$array_item" + counter,
            indexPlaceholder: "$index" + counter,
            rule: subRule,
        };

        if (Object.keys(array_rule).length === 0) {
            array_rule = rule;
            current_rule = rule;
            current_subrule = subRule;
        } else {
            // replace the placeholder argument in the current rule with the new rule
            current_subrule.arguments[1] = rule;
            current_rule = rule;
            current_subrule = subRule;
        }

        counter += 1
        currentPathList.push("items");
    }

    // add actual rule to array rule structure
    current_subrule.arguments[1] = formula;

    return array_rule
}


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

    /**
     * 
     * @param generator 
     * @param path a list of ids of the parents
     * @param elementUid uid of the leaf element
     * @returns a schema that can be used as an if or then statement
     */
    private createSubJsonSchema(generator: SchemaGenerator, path: string[], elementUid: string, isSourceStatement: boolean): JSONSchema {
        const element = assertDefined(generator.document.getElementById(elementUid), `Element with uid ${elementUid} not found`);
        const leafStatement = assertDefined(element.getAllOfLeafStatement(), `Element with uid ${elementUid} and id ${element.id} does not have an allOf leaf statement`);

        // adapt leafStatement to dependencyType
        // TODO minlength only if type string etc. minimum maximum? minitems maxitems?
        // TODO only use this.value if subjsonschema is for source element
        if (this.dependencyType === DependencyType.minLength || this.dependencyType === DependencyType.maxLength) {
            if (typeof this.value !== "number") throw new Error(`Dependency value must be a number for dependencyType ${this.dependencyType}`);
            leafStatement.minLength = isSourceStatement ? this.value : 1;
        } else if (this.dependencyType === DependencyType.equal) {
            leafStatement.const = this.value;
        } else {
            // if (element.isStringLike())
            // TODO all other dependencytypes. put this logic in a separate
            // function (also useful for unit tests).
        }

        let currentSubSchema: Record<string, any> = {};
        const finalSubSchema = currentSubSchema;

        for (let i = 0; i < path.length - 1; i++) {
            const currentPathSegment = path[i];
            const nextPathSegment = path[i + 1];
            if (currentPathSegment === undefined || nextPathSegment === undefined) {
                throw new Error(`Path segment is undefined for path: ${path}`);
            }
            currentSubSchema[currentPathSegment] = {};
            if (currentPathSegment === "properties") {
                currentSubSchema.required = [nextPathSegment];
            }
            currentSubSchema = currentSubSchema[currentPathSegment];
        }

        const lastPathSegment = assertDefined(path[path.length - 1], `Last path segment is undefined for path: ${path}`);
        currentSubSchema[lastPathSegment] = leafStatement;

        return finalSubSchema;
    }

    /**
     * ATTENTION: this schema is generated no matter the required attribute of the target, because some element don't have a required attribute and can still be required due to other factors (e.g. ObjectElement with required children)
     *
     * ONLY call if target element (defined by scope) has an AllOfLeafStatement, otherwise this will throw an error (e.g. for DividerElement or HtmlElement)
     * @param generator 
     * @param scope 
     * @returns 
     */
    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const targetElementUid = assertDefined(scope[scope.length - 1], `Last path segment is undefined for scope: ${scope}`);
        const allOfSchema: JSONSchema = {
            // source
            if: this.createSubJsonSchema(generator, generator.getPath(this.sourceId), this.sourceId, true),
            // target
            then: this.createSubJsonSchema(generator, generator.getPath(targetElementUid), targetElementUid, false)
        };

        return allOfSchema;
    }

    toUiSchema(generator: SchemaGenerator, scope: string[]): Rule {
        const sourceElement = generator.document.getElementById(this.sourceId);
        if (!sourceElement) {
            throw new Error(`Source element with id ${this.sourceId} not found`);
        } else if (!(sourceElement instanceof SimpleElement)) {
            throw new Error(`Source element with id ${this.sourceId} is not a SimpleElement`);
        }

        const sourcePathList = generator.getPath(this.sourceId);
        let sourcePath: string;
        if (sourcePathList.includes("items")) {
            const numberOfItems = sourcePathList.filter(item => item === "items").length;
            sourcePath = `$array_item${numberOfItems}.${transform_scope_to_object_writing_form(sourcePathList.slice(sourcePathList.lastIndexOf("items") + 1))}`;
        } else {
            sourcePath = transform_scope_to_object_writing_form(sourcePathList);
        }

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
                default: sourceElement.isStringLike ? "" : undefined,
            };
        }

        let formula: Formula = {
            type: "comparison",
            operation: this.ritaOperation(),
            allowDifferentTypes: true,
            arguments: [firstArgument, this.value]
        }

        if (sourceElement.isCheckboxGroup) {
            const placeholder = `current_option${sourcePath.replace(".", "_")}`
            const checkboxGroupDependency: Formula = {
                type: "exists",
                array: {type: "atom", path: sourcePath, default: []},
                placeholder: placeholder,
                rule: formula
            };
            formula = checkboxGroupDependency;
        }

        if (sourcePathList.includes("items")) {
            formula = putFormulaWithinArrayRule(sourcePathList, formula);
        }

        const showOn: Rule = {
            id: `rita-rule-${this.id}-${this.uid}`,
            rule: formula
        }
        return showOn;
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

    /**
     * ATTENTION: this schema is generated no matter the required attribute of the target, because some element don't have a required attribute and can still be required due to other factors (e.g. ObjectElement with required children)
     *
     * ONLY call if target element (defined by scope) has an AllOfLeafStatement, otherwise this will throw an error (e.g. for DividerElement or HtmlElement)
     * @param generator
     * @param scope path to the target FormElement
     * @returns a JSONSchema for the DependencyGroup that can be added to the allOf of the overall JsonSchema
     */
    toJsonSchema(generator: SchemaGenerator, scope: string[]): JSONSchema {
        const subschemas: JSONSchema[] = this.data.dependencies.map(depId => {
            const dep = generator.document.getDependency_Group(depId);
            if (!(dep instanceof Dependency || dep instanceof DependencyGroup)) {
                throw new Error(`Dependency with id ${depId} not found or is not a Dependency element`);
            }
            return dep.toJsonSchema(generator, scope);
        });

        if (this.relation === DependencyRelationEnum.enum.not) {
            if (subschemas.length !== 1) {
                throw new Error(`DependencyGroup with relation "NOT" must have exactly one dependency, but has ${subschemas.length}`);
            }
            return {
                "not": subschemas[0]
            };
        } else {
            if (!minTwoItems(subschemas)) {
                throw new Error(`DependencyGroup with relation "and/or" must have at least two dependencies, but has ${subschemas.length}`);
            }
            if (this.relation === DependencyRelationEnum.enum.and) {
                return {
                    "allOf": subschemas
                };
            } else if (this.relation === DependencyRelationEnum.enum.or) {
                return {
                    "anyOf": subschemas
                };
            } else {
                throw new Error(`Unknown relation type: ${this.relation}`);
            }
        }
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
