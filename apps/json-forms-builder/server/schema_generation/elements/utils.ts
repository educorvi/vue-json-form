import type { JSONSchema, Control, HTMLRenderer, Divider, Button, Buttongroup, Modal, Formula, Operator, Comparison } from '@educorvi/vue-json-form-schemas';
import { z } from "zod";
import variantsSchema from "@educorvi/vue-json-form-schemas/src/ui/variants.schema.json";
import type { OutlineVariants, BaseVariants } from "@educorvi/vue-json-form-schemas";
import comparisonSchema from "@educorvi/rita/src/schema/comparison.json";
import operatorSchema from "@educorvi/rita/src/schema/operator.json";

export function createId(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '_');
}

export enum Layout {
    Horizontal = "HorizontalLayout",
    Vertical = "VerticalLayout",
    Group = "Group" // with line to the right of the elements
}

export type CombinedUiSchemaType = Control | HTMLRenderer | Divider | Button | Buttongroup | Modal;


type ButtonVariantFormatValue = NonNullable<BaseVariants | OutlineVariants>;
export const ButtonVariantFormatEnum = z.enum([
  ...variantsSchema.definitions.baseVariants.enum,
  ...variantsSchema.definitions.outlineVariants.enum,
] as [ButtonVariantFormatValue, ...ButtonVariantFormatValue[]]);
export type ButtonVariantFormat = z.infer<typeof ButtonVariantFormatEnum>;

export function cleanUiSchema(uiSchema: Control): void {
    if (uiSchema.options && Object.keys(uiSchema.options).length === 0) {
        delete uiSchema.options;
    }
}

export function minTwoItems<T>(array: T[]): array is [T, T, ...T[]] {
    return array.length >= 2;
}

export function transform_scope_to_object_writing_form(scope: string[]): string {
    const filtered_scope = scope.filter((item) => item !== "properties" && item !== "items");
    return filtered_scope.join(".");
}

//---------------------------Dependency Types and Relations---------------------------------
export type DependencyTypeValue = NonNullable<Comparison["operation"]>;

const ritaOperations = comparisonSchema.properties.operation.enum as DependencyTypeValue[];

export const DependencyType = {
    ...(Object.fromEntries(ritaOperations.map(v => [v, v])) as { [K in DependencyTypeValue]: K }),
    minLength: "minLength",
    maxLength: "maxLength",
} as const;

export type DependencyType = (typeof DependencyType)[keyof typeof DependencyType];

export const DependencyTypeEnumExtended = z.enum(
    Object.values(DependencyType) as [DependencyType, ...DependencyType[]]
);

type DependencyRelationValue = NonNullable<Operator["type"]>;
const ritaOperators = operatorSchema.oneOf.flatMap(o => o.properties.type.enum) as DependencyRelationValue[];

export const DependencyRelation = {
    ...(Object.fromEntries(ritaOperators.map(v => [v, v])) as { [K in DependencyRelationValue]: K }),
} as const;

export type DependencyRelation = (typeof DependencyRelation)[keyof typeof DependencyRelation];

export const DependencyRelationEnum = z.enum(
    ritaOperators as [DependencyRelationValue, ...DependencyRelationValue[]]
);

//--------------------------- End of Dependency Types and Relations---------------------------------


export function splitScopeAt(scope: string[], splitAt: string): string[][] {
    const paths: string[][] = [];
    let current: string[] = [];
    for (const segment of scope) {
        if (segment === splitAt) {
            paths.push(current);
            current = [];
        } else {
            current.push(segment);
        }
    }
    paths.push(current); // remainder after the last "items"
    return paths;
}