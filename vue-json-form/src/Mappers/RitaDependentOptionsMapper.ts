import { MapperWithData } from '@/Mappers/MapperClass.ts';
import type {
    Control,
    JSONSchema,
    Layout,
    Wizard,
    Rule,
} from '@educorvi/vue-json-form-schemas';
import {
    hasOption,
    type IndexType,
    isLayout,
} from '@/typings/typeValidators.ts';
import { getAtoms, Parser, Rule as ParsedRule } from '@educorvi/rita';
import { getOption } from '@/utilities.ts';
import { cleanData } from '@/stores/formData.ts';

export class RitaDependentOptionsMapper extends MapperWithData {
    private depsRuleMap: Record<IndexType, ParsedRule> = {};
    private dependencies: string[] = [];
    private static parser = new Parser();
    getDependencies(): string[] {
        return this.dependencies;
    }

    async map(
        jsonElement: JSONSchema,
        uiElement: Control,
        data: Readonly<Record<string, any>>
    ): Promise<null | {
        jsonElement: JSONSchema;
        uiElement: Control;
    }> {
        if (Object.keys(this.depsRuleMap).length === 0) {
            return { jsonElement, uiElement };
        }
        const newJsonElement: JSONSchema = JSON.parse(
            JSON.stringify(jsonElement)
        );
        const cleanedData = cleanData(data).json;
        let hasChanges = false;
        const evaluatedRules: [string, boolean][] = [];
        for (const [key, rule] of Object.entries(this.depsRuleMap)) {
            evaluatedRules.push([key, await rule.evaluate(cleanedData)]);
        }
        const hiddenOptions = evaluatedRules
            .filter(([_, value]) => !value)
            .map(([key, _]) => key);
        if (hiddenOptions.length > 0) {
            newJsonElement.enum = newJsonElement.enum?.filter(
                (i) => !hiddenOptions.includes(i)
            );
            hasChanges = true;
        }
        return {
            jsonElement: hasChanges ? newJsonElement : jsonElement,
            uiElement,
        };
    }

    registerSchemata(
        jsonSchema: Readonly<JSONSchema>,
        uiSchema: Readonly<Layout | Wizard>,
        scope: string,
        savePath: string,
        jsonElement: JSONSchema,
        uiElement: Control
    ): void {
        super.registerSchemata(
            jsonSchema,
            uiSchema,
            scope,
            savePath,
            jsonElement,
            uiElement
        );
        const depsSet = new Set<string>();
        this.depsRuleMap = this.processOptionFilters(
            uiElement,
            depsSet,
            savePath
        );
        this.dependencies = Array.from(depsSet);
    }
    private processOptionFilters(
        uiElement: Control,
        depsSet: Set<string>,
        savePath: string
    ) {
        const depsRuleMap: Record<IndexType, ParsedRule> = {};
        const optionFilters = getOption(uiElement, 'optionFilters');
        if (optionFilters) {
            for (const [key, rule] of Object.entries(optionFilters)) {
                try {
                    const parsedRule =
                        RitaDependentOptionsMapper.parser.parseRule(rule);
                    depsRuleMap[key] = parsedRule;
                    const atoms = getAtoms([parsedRule]);
                    for (let path of atoms.pathSet) {
                        path =
                            '/properties/' +
                            path.split('.').join('/properties/');
                        depsSet.add(path);
                        console.error(path);
                    }
                } catch (e) {
                    console.warn(`Invalid rule ${rule.id} for option ${key}`);
                }
            }
        }
        return depsRuleMap;
    }
}
