import { MapperWithData } from '@/Mappers/MapperClass.ts';
import type {
    Control,
    JSONSchema,
    Layout,
    Wizard,
} from '@educorvi/vue-json-form-schemas';
import { type IndexType } from '@/typings/typeValidators.ts';
import { getAtoms, Parser, Rule as ParsedRule } from '@educorvi/rita';
import { getOption } from '@/utilities.ts';
import { cleanData } from '@/stores/formData.ts';
import { getArrayItemIndices } from '@/components/ShowOnLogic.ts';

/**
 * A mapper that filters enum options based on RITA rules defined in the UI schema.
 *
 * It looks for an `optionFilters` property in the UI element options.
 * `optionFilters` should be a map where keys correspond to enum values and values are RITA rules.
 * If a rule evaluates to `false`, the corresponding enum value is hidden (removed from the enum list).
 */
export class RitaDependentOptionsMapper extends MapperWithData {
    private depsRuleMap: Record<IndexType, ParsedRule> = {};
    private dependencies: string[] = [];
    private static parser = new Parser();

    /**
     * Returns the list of data dependencies derived from the registered option filters.
     */
    getDependencies(): string[] {
        return this.dependencies;
    }

    /**
     * Maps the JSON schema element by filtering enum options based on evaluated rules.
     *
     * @param jsonElement - The JSON schema element.
     * @param uiElement - The UI control element.
     * @param data - The current form data.
     * @returns The mapped JSON schema and UI element, or null if no rules are present.
     */
    async map(
        jsonElement: Readonly<JSONSchema>,
        uiElement: Readonly<Control>,
        data: Readonly<Record<string, any>>
    ): Promise<null | {
        jsonElement: JSONSchema;
        uiElement: Control;
    }> {
        if (Object.keys(this.depsRuleMap).length === 0) {
            return { jsonElement, uiElement };
        }
        const newJsonElement: JSONSchema = this.cloneJsonElement(jsonElement);
        const cleanedData = {
            $selfIndices: getArrayItemIndices(uiElement),
            ...cleanData(data).json,
        };
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

    /**
     * Registers the schema and processes option filters to determine dependencies.
     *
     * @param jsonSchema - The root JSON schema.
     * @param uiSchema - The root UI schema.
     * @param scope - The scope of the current element.
     * @param savePath - The save path of the current element.
     * @param jsonElement - The JSON schema of the current element.
     * @param uiElement - The UI control of the current element.
     */
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
        const depsSet = new Set<string>();
        this.depsRuleMap = this.getOptionFilterDependencies(
            uiElement,
            depsSet,
            savePath
        );
        this.dependencies = Array.from(depsSet);
    }

    /**
     * Helper function to process option filters and extract dependencies.
     *
     * @param uiElement - The UI control element containing option filters.
     * @param depsSet - A set to collect dependency paths.
     * @param savePath - The save path (unused in current implementation but available).
     * @returns A map of rule IDs to parsed RITA rules.
     */
    private getOptionFilterDependencies(
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
                    for (const path of atoms.pathSet) {
                        // map from rita path to formData path
                        // for items in arrays, we only use the array and do not watch the specific child, since dependencies are only defined once
                        const mappedPath =
                            '/properties/' +
                            path.split('[')[0]?.split('.').join('/properties/');
                        depsSet.add(mappedPath);
                    }
                } catch (e) {
                    console.warn(`Invalid rule ${rule.id} for option ${key}`);
                }
            }
        }
        return depsRuleMap;
    }
}
