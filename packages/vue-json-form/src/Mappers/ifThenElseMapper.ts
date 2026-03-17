/**
 * `IfThenElseMapper` is a data-dependent mapper that implements conditional JSON Schema logic.
 *
 * This mapper scans the schema's `allOf` blocks for `if`/`then`/`else` structures.
 * It identifies rules that affect the current field and monitors changes in data
 * to dynamically augment the field's JSON Schema (e.g., changing `enum` values) or
 * UI Schema (e.g., forcing a field to be `required`).
 */
import jsonPointer from 'json-pointer';
import deepmerge from 'deepmerge';
import deepEqual from 'fast-deep-equal';
import { cleanScope } from '@/computedProperties/json.ts';
import {
    isSupportedIf,
    isSupportedIfCondition,
    isSupportedIfThenElse,
    isValidJsonSchemaKey,
    isNotNullOrUndefined,
} from '@/typings/typeValidators.ts';
import { getPropertyByString, sliceScope, getFieldName } from '@/Commons.ts';
import type {
    Control,
    JSONSchema,
    Layout,
    Wizard,
} from '@educorvi/vue-json-form-schemas';
import { MapperWithData } from '@/Mappers/index.ts';
import type {
    IfConditions,
    IfProperty,
    SupportedIfThenElse,
} from '@/typings/customTypes.ts';

enum ConditionType {
    CONST = 'const',
    ENUM = 'enum',
    CONTAINS_CONST = 'containsConst',
    CONTAINS_ENUM = 'containsEnum',
    MIN_LENGTH = 'minLength',
    REQUIRED = 'required',
}

/** Describes a single condition coming from `if.properties` where
 *  the sibling property `key` must equal the constant `value`. */
type Condition = {
    key: string;
    savePath: string;
    value: unknown;
    type: ConditionType;
};

/** A preprocessed rule extracted from the parent `allOf`:
 *  - `conditions`: pairs of sibling key and required constant value.
 *  - `then`/`else`: schema fragments specifically for the current field.
 */
type ConditionsAndResults = {
    conditions: Condition[];
    then?: JSONSchema;
    else?: JSONSchema;
    thenRequired?: string[];
    elseRequired?: string[];
};

/**
 * Mapper that conditionally augments a field’s JSON Schema based on sibling values.
 *
 * It looks for supported `if`/`then`/`else` blocks inside the parent object’s `allOf`.
 * For each block touching the current field, it records the required sibling
 * conditions and the field-specific schema fragments (`then`/`else`). During `map`,
 * it evaluates the conditions against the provided `data` and merges the resulting
 * properties into the field’s schema.
 *
 * Notes and limitations:
 * - Merge strategy: later matching rules may overwrite keys from earlier ones.
 */
export class IfThenElseMapper extends MapperWithData {
    private conditionsAndResults: ConditionsAndResults[] = [];
    private dependencies: string[] = [];
    registerSchemata(
        jsonSchema: Readonly<JSONSchema>,
        uiSchema: Readonly<Layout | Wizard>,
        scope: Readonly<string>,
        savePath: Readonly<string>,
        jsonElement: Readonly<JSONSchema>,
        uiElement: Readonly<Control>
    ): void {
        super.registerSchemata(
            jsonSchema,
            uiSchema,
            scope,
            savePath,
            jsonElement,
            uiElement
        );
        this.conditionsAndResults = this.getConditionsAndResults();
        this.setDependencies();
    }

    private setDependencies() {
        const deps = new Set<string>();
        for (const cr of this.conditionsAndResults) {
            for (const c of cr.conditions) {
                deps.add(c.savePath);
            }
        }
        this.dependencies = Array.from(deps);
    }
    getDependencies(): string[] {
        return this.dependencies;
    }

    private getFieldName() {
        return getFieldName(this.scope);
    }

    private parseCondition([key, condition]: [
        string,
        IfConditions,
    ]): Condition {
        let conditionType: ConditionType;
        let conditionValue: Condition['value'];
        if ('const' in condition) {
            conditionType = ConditionType.CONST;
            conditionValue = condition.const;
        } else if ('enum' in condition) {
            conditionType = ConditionType.ENUM;
            conditionValue = condition.enum;
        } else if ('contains' in condition) {
            if ('const' in condition.contains) {
                conditionType = ConditionType.CONTAINS_CONST;
                conditionValue = condition.contains.const;
            } else if ('enum' in condition.contains) {
                conditionType = ConditionType.CONTAINS_ENUM;
                conditionValue = condition.contains.enum;
            } else {
                // This should only ever happen if type checking is wrong
                throw new Error('Invalid contains condition');
            }
        } else if ('minLength' in condition) {
            conditionType = ConditionType.MIN_LENGTH;
            conditionValue = condition.minLength;
        } else {
            // This should only ever happen if type checking is wrong
            throw new Error('Invalid condition');
        }

        const conditionSavePath = this.scopeToSavePath(key);

        return {
            value: conditionValue,
            type: conditionType,
            key,
            savePath: conditionSavePath,
        };
    }

    private scopeToSavePath(scope: string) {
        let conditionSavePath = scope;
        const splitSavePath = this.savePath?.split('/');
        for (let i = splitSavePath?.length ?? 0; i >= 0; --i) {
            const remainingSavePath = splitSavePath?.slice(0, i).join('/');
            if (!remainingSavePath) {
                break;
            }
            if (conditionSavePath.includes(cleanScope(remainingSavePath))) {
                conditionSavePath = conditionSavePath.replace(
                    cleanScope(remainingSavePath),
                    remainingSavePath
                );
                break;
            }
        }
        return conditionSavePath;
    }

    private addRequiredConditions(
        ifJson: NonNullable<IfProperty>,
        existingConditions: Condition[],
        objectScope: string
    ) {
        const conditions: Condition[] = [];
        const requireds: string[] =
            'required' in ifJson ? ifJson.required || [] : [];
        for (const required of requireds) {
            const scope = objectScope + '/properties/' + required;
            const savePath = this.scopeToSavePath(scope);
            if (!existingConditions.some((c) => c.savePath === savePath))
                conditions.push({
                    key: required,
                    savePath: savePath,
                    value: null,
                    type: ConditionType.REQUIRED,
                });
        }
        return conditions;
    }

    private parseConditions(
        ifJson: NonNullable<IfProperty>,
        scope: string
    ): Condition[] {
        let conditions: Condition[] = [];
        if ('properties' in ifJson) {
            const newScope = scope + '/properties';
            const ifJsonProperties = ifJson.properties;
            for (const [key, value] of Object.entries(ifJsonProperties || {})) {
                const localNewScope = newScope + '/' + key;
                if (isSupportedIfCondition(value)) {
                    conditions.push(
                        this.parseCondition([localNewScope, value])
                    );
                } else {
                    conditions = conditions.concat(
                        this.parseConditions(value, localNewScope)
                    );
                }
            }
            conditions = conditions.concat(
                this.addRequiredConditions(ifJson, conditions, scope)
            );
        } else if ('items' in ifJson) {
            const newScope = scope + '/items';
            if (isSupportedIfCondition(ifJson.items)) {
                conditions.push(this.parseCondition([newScope, ifJson.items]));
            } else if (isSupportedIf(ifJson.items)) {
                conditions = conditions.concat(
                    this.parseConditions(ifJson.items, newScope)
                );
            }
        } else {
            conditions = this.addRequiredConditions(ifJson, conditions, scope);
        }

        return conditions;
    }

    private getConditionsAndResultsFromAllOf(
        allOfScope: string,
        fieldScope: string
    ) {
        if (!this.jsonSchema) {
            return [];
        }
        let parentAllOf;
        if (jsonPointer.has(this.jsonSchema, allOfScope)) {
            parentAllOf = jsonPointer.get(this.jsonSchema, allOfScope);
        } else {
            return [];
        }

        if (!parentAllOf || !Array.isArray(parentAllOf)) {
            return [];
        }
        const ifThenElses: SupportedIfThenElse[] = parentAllOf.filter(
            isSupportedIfThenElse
        );

        if (
            ifThenElses.length > 0 &&
            ifThenElses.length !== parentAllOf.length
        ) {
            console.warn(
                `Unsupported if/then/else structure(s) detected in ${allOfScope}`,
                parentAllOf.filter((i) => !isSupportedIfThenElse(i))
            );
        }

        const deltaPath = fieldScope.replace(
            sliceScope(allOfScope, -1) + '/',
            ''
        );

        return ifThenElses
            .map((ifThen) => {
                const thenResult = getPropertyByString<JSONSchema>(
                    ifThen.then,
                    deltaPath,
                    '/'
                );
                const elseResult = getPropertyByString<JSONSchema>(
                    ifThen.else,
                    deltaPath,
                    '/'
                );

                const parentDeltaPath = sliceScope(deltaPath, -2);
                const thenRequired = getPropertyByString<string[]>(
                    ifThen.then,
                    parentDeltaPath + '/required',
                    '/'
                );
                const elseRequired = getPropertyByString<string[]>(
                    ifThen.else,
                    parentDeltaPath + '/required',
                    '/'
                );

                if (
                    !thenResult &&
                    !elseResult &&
                    !thenRequired &&
                    !elseRequired
                ) {
                    return undefined;
                }

                return {
                    conditions: this.parseConditions(
                        ifThen.if,
                        sliceScope(allOfScope, -1)
                    ),
                    then: thenResult,
                    else: elseResult,
                    thenRequired,
                    elseRequired,
                };
            })
            .filter((c) => c !== undefined);
    }

    private getConditionsAndResults(): ConditionsAndResults[] {
        let conditionsAndResults: ConditionsAndResults[] = [];
        if (!this.scope || !this.jsonSchema || !this.uiSchema) {
            return conditionsAndResults;
        }
        for (let i = -2; this.scope.split('/').length + i >= 0; i -= 2) {
            let parentAllOfPath = sliceScope(this.scope, i) + '/' + 'allOf';
            parentAllOfPath = cleanScope(parentAllOfPath);
            conditionsAndResults = conditionsAndResults.concat(
                this.getConditionsAndResultsFromAllOf(
                    parentAllOfPath,
                    this.scope
                )
            );
        }
        return conditionsAndResults;
    }

    checkConditionFulfilled(
        condition: Condition,
        data: Readonly<Record<string, unknown>>
    ): boolean {
        if (!this.savePath || !this.scope) {
            return false;
        }
        const actualValue = data[condition.savePath];
        switch (condition.type) {
            case ConditionType.CONST:
                // return actualValue === condition.value;
                return deepEqual(actualValue, condition.value);
            case ConditionType.ENUM:
                return (
                    Array.isArray(condition.value) &&
                    condition.value.includes(actualValue)
                );
            case ConditionType.CONTAINS_CONST:
                if (!Array.isArray(actualValue)) {
                    return false;
                }
                return actualValue.includes(condition.value);
            case ConditionType.CONTAINS_ENUM:
                if (!Array.isArray(actualValue)) {
                    return false;
                }
                return actualValue.some(
                    (a) =>
                        Array.isArray(condition.value) &&
                        condition.value.includes(a)
                );
            case ConditionType.MIN_LENGTH:
                return (
                    (Array.isArray(actualValue) ? actualValue.length : 0) >=
                    (typeof condition.value === 'number' ? condition.value : 0)
                );
            case ConditionType.REQUIRED:
                return isNotNullOrUndefined(actualValue) && actualValue !== '';
        }
    }

    async map(
        jsonElement: Readonly<JSONSchema>,
        uiElement: Readonly<Control>,
        data: Readonly<Record<string, unknown>>
    ): Promise<null | {
        jsonElement: JSONSchema;
        uiElement: Control;
    }> {
        const fieldName = this.getFieldName();
        if (
            !this.jsonSchema ||
            !this.uiSchema ||
            !this.savePath ||
            !fieldName
        ) {
            return { jsonElement, uiElement };
        }

        const { newJsonElement, newUiElement } = this.cloneElements(
            jsonElement,
            uiElement
        );
        let hasChanges = false;
        let uiHasChanges = false;

        for (const ifThen of this.conditionsAndResults) {
            const {
                then: thenResult,
                else: elseResult,
                elseRequired,
                thenRequired,
            } = ifThen;
            if (!thenResult && !elseResult && !thenRequired && !elseRequired) {
                continue;
            }
            const fulfilled = ifThen.conditions.every((cond) =>
                this.checkConditionFulfilled(cond, data)
            );

            const props = fulfilled ? thenResult || {} : elseResult || {};

            for (const [key, val] of Object.entries(props)) {
                if (isValidJsonSchemaKey(key)) {
                    if (typeof val !== 'object') {
                        // Only update if the value actually changed
                        if (newJsonElement[key] !== val) {
                            newJsonElement[key] = val;
                            hasChanges = true;
                        }
                    } else {
                        if (val) {
                            const overwriteMerge = (
                                _destinationArray: unknown[],
                                sourceArray: unknown[]
                            ) => sourceArray;
                            const merged = deepmerge(
                                newJsonElement[key] || {},
                                val,
                                { arrayMerge: overwriteMerge }
                            );
                            if (
                                JSON.stringify(merged) !==
                                JSON.stringify(newJsonElement[key] || {})
                            ) {
                                newJsonElement[key] = merged;
                                hasChanges = true;
                            }
                        }
                    }
                }
            }

            const required = fulfilled ? thenRequired : elseRequired;

            if (required?.includes(fieldName)) {
                if (!newUiElement.options) {
                    newUiElement.options = {};
                }
                newUiElement.options.forceRequired = true;
                uiHasChanges = true;
            }
        }

        // Only return a new object if something actually changed
        return {
            jsonElement: hasChanges ? newJsonElement : jsonElement,
            uiElement: uiHasChanges ? newUiElement : uiElement,
        };
    }
}
