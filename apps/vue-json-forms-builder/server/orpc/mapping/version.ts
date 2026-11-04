import { FormRevision } from '@educorvi/vue-json-forms-builder-db-layer';
import {
    yjsStateToArtifacts,
    type FormArtifacts,
} from '~~/server/lib/form-content';
import {
    zFormVersionRef,
    zFormSchemaPayloadArtifacts,
} from '../generated/zod.gen';
import { toAuditRef } from './shared';
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
 *
 * The json/ui artifacts are DERIVED from the revision's stored yjs state
 * (the single source of truth) — they are never stored separately.
 */
export function mapDbRevisionToApiVersion(rev: FormRevision): ApiFormVersion {
    const artifacts = yjsStateToArtifacts(rev.yjs_state) ?? {
        json: null,
        ui: null,
    };
    return {
        version: `${rev.version}.0.0`,
        comment: rev.comment ?? '',
        json: artifacts.json ?? {},
        ui: artifacts.ui ?? {},
        created_by: toAuditRef(rev.created_by, rev.created.toISOString()),
        updated_by: toAuditRef(rev.updated_by, rev.updated.toISOString()),
    };
}

/**
 * Pick JSON/UI artifacts from a derived artifacts object.
 *
 * - Restricts the result to the requested `artifacts` kinds when provided
 *   (the `?artifacts=` query parameter, a list of enum values; the wire
 *   form `?artifacts=json` is normalized to a list during validation).
 *   An empty/omitted list means "all artifacts".
 * - Omits null artifacts so the result matches the `FormSchemaPayloadArtifacts`
 *   shape (both keys are optional records).
 */
export function pickArtifacts(
    artifacts: FormArtifacts | null,
    which?: readonly ArtifactKey[] | null
): ArtifactMap {
    const requested = which ?? [];
    const keys: readonly ArtifactKey[] =
        requested.length > 0 ? requested : ALL_ARTIFACTS;
    const result: ArtifactMap = {};
    for (const key of keys) {
        const value = artifacts?.[key];
        if (value) {
            result[key] = value;
        }
    }
    return result;
}
