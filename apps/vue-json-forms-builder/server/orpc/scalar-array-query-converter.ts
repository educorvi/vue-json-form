/**
 * TODO: dirty fix: query parameter enum array resolution
 * Problems with SmartCoerce Plugin
 */
import type { ConditionalSchemaConverter } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import {
    isScalarArrayCoercedSchema,
    unwrapScalarArrayCoercedSchema,
} from './contract-with-errors';

const zodSchemaConverter = new ZodToJsonSchemaConverter();

export class ScalarArrayQueryConverter implements ConditionalSchemaConverter {
    public condition(
        schema: Parameters<typeof zodSchemaConverter.convert>[0],
        _options: Parameters<typeof zodSchemaConverter.convert>[1]
    ): boolean {
        return isScalarArrayCoercedSchema(schema);
    }

    public convert(
        schema: Parameters<typeof zodSchemaConverter.convert>[0],
        options: Parameters<typeof zodSchemaConverter.convert>[1]
    ) {
        return zodSchemaConverter.convert(
            unwrapScalarArrayCoercedSchema(schema) as typeof schema,
            options
        );
    }
}

export const scalarArrayQueryConverter = new ScalarArrayQueryConverter();
