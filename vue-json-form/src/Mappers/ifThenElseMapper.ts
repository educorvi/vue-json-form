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

type Condition = {
    key: string;
    value: any;
};

type ConditionsAndResults = {
    conditions: Condition[];
    then?: JSONSchema;
    else?: JSONSchema;
};

// todo: support other depth than own one
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

        let newJsonElement: JSONSchema = jsonElement;
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
