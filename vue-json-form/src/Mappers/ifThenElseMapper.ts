/**
 * IfThenElseMapper
 *
 * Applies conditional JSON Schema fragments (then/else) to a single field based on
 * sibling data using JSON Schema style `if`/`then`/`else` blocks that are
 * collected via an `allOf` on the parent object.
 *
 *
 * Mapper behavior in short:
 * - During `registerSchemata`, the mapper reads the parent `allOf` and extracts every
 *   supported `{ if: { properties: ... }, then: { properties: ... }, else?: ... }` block
 *   that touches the current field (by `fieldName`).
 * - During `map`, it evaluates the conditions against sibling values in `data` and
 *   merges the corresponding `then` or `else` properties into the current field’s
 *   JSON Schema. Later rules overwrite earlier ones when they define the same keys.
 * - `getDependencies` returns the list of sibling data paths this field depends on.
 */
import jsonPointer from 'json-pointer';
import deepmerge, { type ArrayMergeOptions } from 'deepmerge';
import deepEqual from 'fast-deep-equal';
import { cleanScope } from '@/computedProperties/json.ts';
import {
    isIfThenAllOf,
    isSupportedIfThenElse,
    isValidJsonSchemaKey,
} from '@/typings/typeValidators.ts';
import { sliceScope } from '@/Commons.ts';
import type {
    Control,
    JSONSchema,
    Layout,
    Wizard,
} from '@educorvi/vue-json-form-schemas';
import { MapperWithData } from '@/Mappers/index.ts';
import type {
    IfConditions,
    SupportedIfThenElse,
} from '@/typings/customTypes.ts';

enum ConditionType {
    CONST = 'const',
    ENUM = 'enum',
    CONTAINS_CONST = 'containsConst',
    CONTAINS_ENUM = 'containsEnum',
}

/** Describes a single condition coming from `if.properties` where
 *  the sibling property `key` must equal the constant `value`. */
type Condition = {
    key: string;
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

// todo: support other depth than own one
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
 * - Depth: currently only supports conditions defined at the immediate parent level
 *   of the current field (see `todo` above).
 * - Const: only supports `const` conditions.
 * - Merge strategy: later matching rules may overwrite keys from earlier ones.
 */
export class IfThenElseMapper extends MapperWithData {
    private conditionsAndResults: ConditionsAndResults[] = [];
    private dependencies: string[] = [];
    registerSchemata(
        jsonSchema: Readonly<JSONSchema>,
        uiSchema: Readonly<Layout | Wizard>,
        scope: string,
        savePath: string
    ): void {
        this.jsonSchema = jsonSchema;
        this.uiSchema = uiSchema;
        this.scope = scope;
        this.savePath = savePath;
        this.conditionsAndResults = this.getConditionsAndResults();
        this.setDependencies();
    }

    private setDependencies() {
        if (!this.savePath) return;
        const deps = new Set<string>();
        for (const cr of this.conditionsAndResults) {
            for (const c of cr.conditions) {
                const depSavePath = sliceScope(this.savePath, -1) + '/' + c.key;
                deps.add(depSavePath);
            }
        }
        this.dependencies = Array.from(deps);
    }
    getDependencies(): string[] {
        return this.dependencies;
    }

    private getFieldName() {
        return this.scope?.split('/').pop();
    }

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
        } else {
            // This should only ever happen if type checking is wrong
            throw new Error('Invalid condition');
        }

        return {
            value: conditionValue,
            type: conditionType,
            key,
        };
    }

    private parseConditions(
        ifJson: SupportedIfThenElse['if']['properties']
    ): Condition[] {
        return Object.entries(ifJson).map(this.parseCondition);
    }

    private getConditionsAndResults(): ConditionsAndResults[] {
        const fieldName = this.getFieldName();
        if (!fieldName || !this.scope || !this.jsonSchema || !this.uiSchema) {
            return [];
        }
        let parentAllOfPath = sliceScope(this.scope, -2) + '/' + 'allOf';
        parentAllOfPath = cleanScope(parentAllOfPath);
        let parentAllOf;
        if (jsonPointer.has(this.jsonSchema, parentAllOfPath)) {
            parentAllOf = jsonPointer.get(this.jsonSchema, parentAllOfPath);
        } else {
            return [];
        }

        if (!parentAllOf || !isIfThenAllOf(parentAllOf)) {
            return [];
        }

        return parentAllOf
            .map((ifThen) => {
                if (isSupportedIfThenElse(ifThen)) {
                    const thenResult = ifThen.then.properties?.[fieldName];
                    const elseResult = ifThen.else?.properties?.[fieldName];

                    const thenRequired = ifThen.then.required;
                    const elseRequired = ifThen.else?.required;

                    if (
                        !thenResult &&
                        !elseResult &&
                        !thenRequired &&
                        !elseRequired
                    ) {
                        return undefined;
                    }

                    return {
                        conditions: this.parseConditions(ifThen.if.properties),
                        then: thenResult,
                        else: elseResult,
                        thenRequired,
                        elseRequired,
                    };
                }
            })
            .filter((c) => c !== undefined);
    }

    checkConditionFulfilled(
        condition: Condition,
        data: Readonly<Record<string, any>>
    ): boolean {
        const actualValue = this.savePath
            ? data[sliceScope(this.savePath, -1) + '/' + condition.key]
            : undefined;
        if (actualValue === undefined) {
            return false;
        }
        switch (condition.type) {
            case ConditionType.CONST:
                // return actualValue === condition.value;
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
        }
    }

    map(
        jsonElement: JSONSchema,
        uiElement: Control,
        data: Readonly<Record<string, any>>
    ): {
        jsonElement: JSONSchema;
        uiElement: Control;
    } | null {
        const fieldName = this.getFieldName();
        if (
            !this.jsonSchema ||
            !this.uiSchema ||
            !this.savePath ||
            !fieldName
        ) {
            return { jsonElement, uiElement };
        }

        let newJsonElement: JSONSchema = JSON.parse(
            JSON.stringify(jsonElement)
        );
        let newUiElement: Control = JSON.parse(JSON.stringify(uiElement));
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

            for (let [key, val] of Object.entries(props)) {
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
                                JSON.parse(JSON.stringify(merged)) !==
                                JSON.parse(
                                    JSON.stringify(newJsonElement[key] || {})
                                )
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
