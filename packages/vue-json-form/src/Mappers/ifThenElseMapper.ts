/**
 * `IfThenElseMapper` is a data-dependent mapper that implements conditional JSON Schema logic.
 *
 * This mapper scans the schema's `allOf` blocks for `if`/`then`/`else` structures.
 * It identifies rules that affect the current field and monitors changes in data
 * to dynamically augment the field's JSON Schema (e.g., changing `enum` values) or
 * UI Schema (e.g., forcing a field to be `required`).
 */
import jsonPointer from 'json-pointer';
import deepmerge, { type ArrayMergeOptions } from 'deepmerge';
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
    value: any;
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

    /**
     * Extracts the field name from the current scope.
     *
     * @returns The name of the field represented by this mapper's scope.
     */
    private getFieldName() {
        return getFieldName(this.scope);
    }

    /**
     * Parses a single condition from an `if.properties` entry.
     *
     * Converts a condition object into a `Condition` record that includes:
     * - The key name and its save path in the data object
     * - The condition type and value to check against
     *
     * @param key - The sibling property key and its full scope path (as a tuple)
     * @param condition - The condition object to parse
     * @returns A normalized `Condition` object ready for evaluation
     * @throws Error if the condition structure is not recognized
     */
    private parseCondition([key, condition]: [
        string,
        IfConditions,
    ]): Condition {
        let conditionType: ConditionType;
        let conditionValue: any;
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

        let conditionSavePath = this.scopeToSavePath(key);

        return {
            value: conditionValue,
            type: conditionType,
            key,
            savePath: conditionSavePath,
        };
    }

    /**
     * Converts a JSON Schema scope path to a data save path.
     *
     * Makes sure that dependencies in arrays work
     *
     * @param scope - The JSON Schema scope to convert
     * @returns The corresponding data save path
     */
    private scopeToSavePath(scope: string) {
        let conditionSavePath = scope;
        let splitSavePath = this.savePath?.split('/');
        // Try progressively shorter parent paths to find a match
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

    /**
     * Extracts required field conditions from an `if` schema block.
     *
     * If the `if` block specifies a `required` array, this method converts each
     * required field name into a `Condition` that will be checked during mapping.
     * This allows conditional logic to enforce that certain fields must be non-empty.
     *
     * @param ifJson - The parsed `if` schema block
     * @param existingConditions - Already-parsed conditions to avoid duplicates
     * @param objectScope - The JSON Schema scope of the parent object containing the required fields
     * @returns An array of conditions representing required field constraints
     */
    private addRequiredConditions(
        ifJson: NonNullable<IfProperty>,
        existingConditions: Condition[],
        objectScope: string
    ) {
        const conditions: Condition[] = [];
        let requireds: string[] =
            'required' in ifJson ? ifJson.required || [] : [];
        for (let required of requireds) {
            const scope = objectScope + '/properties/' + required;
            const savePath = this.scopeToSavePath(scope);
            // Avoid obsolete conditions by checking existing conditions
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

    /**
     * Recursively parses all conditions from an `if` schema block.
     *
     * Handles nested structures by recursively processing `properties` and `items`
     * fields.
     *
     * @param ifJson - The parsed `if` schema block to process
     * @param scope - The current JSON Schema scope for path tracking
     * @returns A flat array of all conditions extracted from the potentially nested structure
     */
    private parseConditions(
        ifJson: NonNullable<IfProperty>,
        scope: string
    ): Condition[] {
        let conditions: Condition[] = [];
        if ('properties' in ifJson) {
            // Handle object properties: recursively parse each property
            const newScope = scope + '/properties';
            const ifJsonProperties = ifJson.properties;
            for (const [key, value] of Object.entries(ifJsonProperties || {})) {
                const localNewScope = newScope + '/' + key;
                if (isSupportedIfCondition(value)) {
                    conditions.push(
                        this.parseCondition([localNewScope, value])
                    );
                } else {
                    // Recursively handle nested if/then/else structures
                    conditions = conditions.concat(
                        this.parseConditions(value, localNewScope)
                    );
                }
            }
        } else if ('items' in ifJson) {
            // Handle array items: parse the item schema
            const newScope = scope + '/items';
            if (isSupportedIfCondition(ifJson.items)) {
                conditions.push(this.parseCondition([newScope, ifJson.items]));
            } else if (isSupportedIf(ifJson.items)) {
                // Recursively handle nested if structures in array items
                conditions = conditions.concat(
                    this.parseConditions(ifJson.items, newScope)
                );
            }
        }
        conditions = conditions.concat(
            this.addRequiredConditions(ifJson, conditions, scope)
        );

        return conditions;
    }

    /**
     * Extracts all `if`/`then`/`else` rules from an `allOf` array that affect a specific field.
     *
     *
     * @param allOfScope - The JSON Schema pointer to the `allOf` array (e.g., `/properties/obj/allOf`)
     * @param fieldScope - The JSON Schema scope of the current field being processed
     * @returns An array of preprocessed `ConditionsAndResults` objects ready for evaluation
     */
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
        // Filter for supported if/then/else structures
        const ifThenElses: SupportedIfThenElse[] = parentAllOf.filter(
            isSupportedIfThenElse
        );

        // Warn if unsupported structures are mixed with supported ones
        if (
            ifThenElses.length > 0 &&
            ifThenElses.length !== parentAllOf.length
        ) {
            console.warn(
                `Unsupported if/then/else structure(s) found in ${allOfScope}`,
                parentAllOf.filter((i) => !isSupportedIfThenElse(i))
            );
        }

        // Calculate the relative path from allOf container to the target field
        const deltaPath = fieldScope.replace(
            sliceScope(allOfScope, -1) + '/',
            ''
        );

        return ifThenElses
            .map((ifThen) => {
                // Extract field-specific schema fragments from then/else blocks
                const thenResult = getPropertyByString(
                    ifThen.then,
                    deltaPath,
                    '/',
                    null
                );
                const elseResult = getPropertyByString(
                    ifThen.else,
                    deltaPath,
                    '/',
                    null
                );

                // Extract required field constraints from parent object level
                const parentDeltaPath = sliceScope(deltaPath, -2);
                const thenRequired = getPropertyByString(
                    ifThen.then,
                    parentDeltaPath + '/required',
                    '/',
                    null
                );
                const elseRequired = getPropertyByString(
                    ifThen.else,
                    parentDeltaPath + '/required',
                    '/',
                    null
                );

                // Skip rules that don't affect this field
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

    /**
     * Collects all relevant `if`/`then`/`else` rules from parent scopes.
     *
     * @returns A flat array of all `ConditionsAndResults` objects collected from all parent scopes
     */
    private getConditionsAndResults(): ConditionsAndResults[] {
        let conditionsAndResults: ConditionsAndResults[] = [];
        if (!this.scope || !this.jsonSchema || !this.uiSchema) {
            return conditionsAndResults;
        }
        // Iterate up the scope hierarchy in steps of 2 (property levels)
        for (let i = -2; this.scope.split('/').length + i >= 0; i -= 2) {
            let parentAllOfPath =
                sliceScope(this.scope, i).replace(/\/properties$/, '') +
                '/' +
                'allOf';
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

    /**
     * Evaluates whether a required field condition is satisfied in the provided data.
     *
     * A required condition is considered fulfilled if:
     * 1. The direct field value is non-null, non-undefined, and not empty, OR
     * 2. Any nested child field (prefixed with `conditionSavePath/`) contains a non-empty value
     *
     * This allows the mapper to recognize when a nested structure has been populated,
     * treating it as satisfying the parent's "required" constraint.
     *
     * @param actualValue - The field's current value from the data
     * @param data - The complete flattened data object with all nested fields
     * @param conditionSavePath - The save path of the field being checked
     * @returns true if the required condition is satisfied, false otherwise
     */
    private checkRequiredConditionFulfilled(
        actualValue: Readonly<unknown>,
        data: Readonly<Record<string, any>>,
        conditionSavePath: Readonly<string>
    ): boolean {
        if (isNotNullOrUndefined(actualValue) && actualValue !== '') {
            return true;
        } else {
            // Check if any child fields (nested properties) are populated
            return Object.keys(data)
                .filter((k) => k.startsWith(conditionSavePath + '/'))
                .some((k) => {
                    return isNotNullOrUndefined(data[k]) && data[k] !== '';
                });
        }
    }

    /**
     * Evaluates whether a single condition is satisfied in the provided data.
     *
     * Supports multiple condition types:
     * - `CONST`: value must equal the constant
     * - `ENUM`: value must be in the enum array
     * - `CONTAINS_CONST`: array value must contain the constant
     * - `CONTAINS_ENUM`: array value must contain at least one item from the enum
     * - `MIN_LENGTH`: value's length must be >= the specified minimum
     * - `REQUIRED`: field must be populated or have populated nested fields
     *
     *
     * @param condition - The condition to evaluate
     * @param data - The flattened data object containing field values
     * @returns true if the condition is met, false otherwise
     */
    private checkConditionFulfilled(
        condition: Condition,
        data: Readonly<Record<string, any>>
    ): boolean {
        if (!this.savePath || !this.scope) {
            return false;
        }
        const actualValue = data[condition.savePath];
        switch (condition.type) {
            case ConditionType.CONST:
                // Uses deep equality instead of strict equality for complex types
                return deepEqual(actualValue, condition.value);
            case ConditionType.ENUM:
                return condition.value.includes(actualValue);
            case ConditionType.CONTAINS_CONST:
                if (!Array.isArray(actualValue)) {
                    return false;
                }
                return actualValue.includes(condition.value);
            case ConditionType.CONTAINS_ENUM:
                if (!Array.isArray(actualValue)) {
                    return false;
                }
                return actualValue.some((a) => condition.value.includes(a));
            case ConditionType.MIN_LENGTH:
                return (actualValue?.length ?? 0) >= condition.value;
            case ConditionType.REQUIRED:
                return this.checkRequiredConditionFulfilled(
                    actualValue,
                    data,
                    condition.savePath
                );
        }
    }

    /**
     * Maps conditional schema changes based on current data state.
     *
     * This is the main entry point for the mapper. For each registered `if`/`then`/`else` rule:
     * 1. Evaluates all conditions against the provided data
     * 2. If all conditions are met, applies the `then` schema fragments
     * 3. If any condition fails, applies the `else` schema fragments
     * 4. Merges selected properties into the field's JSON Schema
     * 5. Applies any required field constraints to the UI Schema
     *
     * Only returns a new object if actual changes were made.
     *
     * @param jsonElement - The current JSON Schema element for this field
     * @param uiElement - The current UI Schema element for this field
     * @param data - The flattened data object containing current field values
     * @returns An object with potentially updated jsonElement and uiElement, or the originals if no changes occurred
     */
    async map(
        jsonElement: Readonly<JSONSchema>,
        uiElement: Readonly<Control>,
        data: Readonly<Record<string, any>>
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

        // Process each if/then/else rule
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
            // Evaluate all conditions: true only if ALL are met
            const fulfilled = ifThen.conditions.every((cond) =>
                this.checkConditionFulfilled(cond, data)
            );

            // Select schema fragment based on condition evaluation
            const props = fulfilled ? thenResult || {} : elseResult || {};

            // Apply schema properties to the JSON element
            for (let [key, val] of Object.entries(props)) {
                if (isValidJsonSchemaKey(key)) {
                    if (typeof val !== 'object') {
                        // For primitive values, only update if changed
                        if (newJsonElement[key] !== val) {
                            newJsonElement[key] = val;
                            hasChanges = true;
                        }
                    } else {
                        // For object values, deep merge with array overwrite strategy
                        if (val) {
                            const overwriteMerge = (
                                destinationArray: any[],
                                sourceArray: any[],
                                options: ArrayMergeOptions
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

            // Apply required field constraints to UI element
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
