import type { FindOptionsOrderValue } from 'typeorm';
import { Visibility } from '~~/server/db/entities/BaseEntities';
import { z } from 'zod';
import { zUserRef, zVisibility } from '../generated/zod.gen';

export type ApiSortOrder = 'asc' | 'desc';

const MAP_API_SORT_ORDER_TO_DB: Record<ApiSortOrder, FindOptionsOrderValue> = {
    asc: 'ASC',
    desc: 'DESC',
};

export function mapApiSortOrderToDbSortOrder(
    order: ApiSortOrder
): FindOptionsOrderValue {
    return MAP_API_SORT_ORDER_TO_DB[order];
}

export type ApiVisibility = z.infer<typeof zVisibility>;

const MAP_DB_VISIBILITY_TO_API: Record<Visibility, ApiVisibility> = {
    [Visibility.Visible]: 'visible',
    [Visibility.Private]: 'private',
};

const MAP_API_VISIBILITY_TO_DB: Record<ApiVisibility, Visibility> = {
    visible: Visibility.Visible,
    private: Visibility.Private,
};

export function mapVisibilityToApi(visibility: Visibility): ApiVisibility {
    return MAP_DB_VISIBILITY_TO_API[visibility];
}

export function mapVisibilityToDb(visibility: ApiVisibility): Visibility {
    return MAP_API_VISIBILITY_TO_DB[visibility];
}

// ── Audit user mapping ────────────────────────────────────────────────────

type ApiUserRef = z.infer<typeof zUserRef>;

/** A user reference with a modification timestamp, as returned by the API. */
export type ApiAuditRef = ApiUserRef & { timestamp: string };

function missingAuditUserError(): never {
    throw new Error(
        'Audit user missing — created_by/updated_by relation is not set'
    );
}

/**
 * Returns the user reference or throws if it is missing.
 *
 * A missing audit user means the code path that persisted the row forgot to
 * set `created_by`/`updated_by` — it should fail loudly instead of
 * fabricating a placeholder user.
 */
export function requireUserRef(
    user: ApiUserRef | null | undefined
): ApiUserRef {
    if (!user) {
        return missingAuditUserError();
    }
    return user;
}

/**
 * Maps a DB audit user (`created_by`/`updated_by` relation) to the API ref,
 * including the timestamp. Throws when the user is missing — see
 * `requireUserRef`.
 */
export function toAuditRef(
    user: ApiUserRef | null | undefined,
    timestamp: string
): ApiAuditRef {
    return { ...requireUserRef(user), timestamp };
}
