import { ApiKey } from '~~/server/db/entities/ApiKey';
import { ResponseApiKey } from '~~/server/services/ApiKeyService';

// Helpers
export function mapDbApiKeyToResponse(key: ApiKey): ResponseApiKey {
    return {
        id: key.id,
        name: key.name,
        description: key.description,
        identifier: key.identifier,
        expires_at: key.expires_at?.toISOString() ?? undefined,
    };
}
