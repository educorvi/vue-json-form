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
} from '@educorvi/vue-json-form-schemas';
import { MapperWithData } from '@/Mappers/index.ts';

/** Describes a single condition coming from `if.properties` where
 *  the sibling property `key` must equal the constant `value`. */
type Condition = {
    key: string;
    value: any;
};

/** A preprocessed rule extracted from the parent `allOf`:
 *  - `conditions`: pairs of sibling key and required constant value.
 *  - `then`/`else`: schema fragments specifically for the current field.
 */
type ConditionsAndResults = {
    conditions: Condition[];
    then?: JSONSchema;
    else?: JSONSchema;
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
        uiSchema: Readonly<Layout>,
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
                    const thenResult = ifThen.then.properties[fieldName];
                    const elseResult = ifThen.else?.properties[fieldName];
                    if (!thenResult && !elseResult) {
                        return undefined;
                    }

                    return {
                        conditions: Object.entries(ifThen.if.properties).map(
                            ([key, value]) => {
                                return { key, value: value.const };
                            }
                        ),
                        then: thenResult,
                        else: elseResult,
                    };
                }
            })
            .filter((c) => c !== undefined);
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
        let hasChanges = false;

        for (const ifThen of this.conditionsAndResults) {
            const thenResult = ifThen.then;
            const elseResult = ifThen.else;
            if (!thenResult && !elseResult) {
                continue;
            }

            const fulfilled = ifThen.conditions.every(({ key, value }) =>
                this.savePath
                    ? data[sliceScope(this.savePath, -1) + '/' + key] === value
                    : false
            );

            const props = fulfilled ? ifThen.then || {} : ifThen.else || {};

            for (let [key, val] of Object.entries(props)) {
                if (isValidJsonSchemaKey(key)) {
                    // Only update if the value actually changed
                    if (newJsonElement[key] !== val) {
                        newJsonElement[key] = val;
                        hasChanges = true;
                    }
                }
            }
        }

        // Only return a new object if something actually changed
        return {
            jsonElement: hasChanges ? newJsonElement : jsonElement,
            uiElement,
        };
    }
}
