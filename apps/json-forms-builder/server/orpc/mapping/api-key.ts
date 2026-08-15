import { ApiKey } from '~~/server/db/entities/ApiKey';
import type { ResponseApiKey } from '~~/server/services/ApiKeyService';
import { toApiDate } from './shared';

// Helpers
export function mapDbApiKeyToResponse(key: ApiKey): ResponseApiKey {
    return {
        id: key.id,
        name: key.name,
        description: key.description,
        identifier: key.identifier,
        // `expires_at` is a `date` column: TypeORM repo reads return a
        // 'YYYY-MM-DD' string (raw SQL would return a Date) — never call
        // `.toISOString()` on it (crash + wrong shape).
        expires_at: toApiDate(key.expires_at),
        created: key.created.toISOString(),
        updated: key.updated.toISOString(),
    };
}
