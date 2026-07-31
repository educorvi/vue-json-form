import { FormRevision } from '~~/server/db/entities/FormRevision';
import {
    zFormVersionRef,
    zFormSchemaPayloadArtifacts,
} from '../generated/zod.gen';
import z from 'zod';

type ApiFormVersion = z.infer<typeof zFormVersionRef>;

/**
 * Artifact keys and shape are derived from the generated API schema
 * (`FormSchemaPayloadArtifacts`) so `'json' | 'ui'` is not duplicated.
 */
type ArtifactKey = keyof z.infer<typeof zFormSchemaPayloadArtifacts>;
type ArtifactMap = Partial<z.infer<typeof zFormSchemaPayloadArtifacts>>;

const ALL_ARTIFACTS: readonly ArtifactKey[] = ['json', 'ui'];

/**
 * Map a DB revision to the API version shape.
 *
 * The DB stores versions as plain integers, while the API exposes them as
 * semantic version strings (`^\d+\.\d+\.\d+$`, e.g. `1.0.0`). An integer `n`
 * therefore maps to `n.0.0`; parsing back is done with `parseInt`.
 */
export function mapDbRevisionToApiVersion(rev: FormRevision): ApiFormVersion {
    const schema = rev.schema ?? { json: null, ui: null };
    return {
        version: `${rev.version}.0.0`,
        comment: rev.comment ?? '',
        json: schema.json ?? {},
        ui: schema.ui ?? {},
        created_by: {
            id: rev.created_by?.id ?? '0',
            name: rev.created_by?.name ?? 'System',
            email: rev.created_by?.email ?? 'system@example.com',
            timestamp: rev.created.toISOString(),
        },
        updated_by: {
            id: rev.updated_by?.id ?? '0',
            name: rev.updated_by?.name ?? 'System',
            email: rev.updated_by?.email ?? 'system@example.com',
            timestamp: rev.updated.toISOString(),
        },
    };
}

/**
 * Pick JSON/UI artifacts from a revision schema.
 *
 * - Restricts the result to the requested `artifacts` subset when provided.
 * - Omits null artifacts so the result matches the `FormSchemaPayloadArtifacts`
 *   shape (both keys are optional records).
 */
export function pickArtifacts(
    schema: NonNullable<FormRevision['schema']>,
    which?: readonly ArtifactKey[]
): ArtifactMap {
    const keys: readonly ArtifactKey[] =
        which && which.length > 0 ? which : ALL_ARTIFACTS;
    const result: ArtifactMap = {};
    for (const key of keys) {
        const value = schema[key];
        if (value) {
            result[key] = value;
        }
    }
    return result;
}
