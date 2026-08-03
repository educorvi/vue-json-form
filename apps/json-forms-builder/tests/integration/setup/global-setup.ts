import { AppDataSource } from '../../../server/db/data-source';
import { User } from '../../../server/db/entities/User';
import { ApiKey } from '../../../server/db/entities/ApiKey';
import { ApiKeyService } from '../../../server/services/ApiKeyService';
import { seed } from '../../../server/db/seed';

/**
 * Vitest `globalSetup` for the `integration` project — runs exactly once
 * per test run, in the main process, before any test file/worker starts.
 *
 * Authenticates integration tests the same way a real API client would:
 * a Bearer API key, provisioned here for the `test` user seeded by the
 * app's own dev seed (server/db/seed.ts) — the same user that also exists
 * in the dev Keycloak realm (see keycloak/dev-realm.json), so this is a
 * real, existing identity, not one invented for tests. There is no
 * test-only login bypass.
 *
 * Reuses the app's own `AppDataSource`, seed script and `ApiKeyService`
 * directly rather than re-implementing user/schema knowledge in test-only
 * code — the alternative (hand-rolled SQL/fixtures) would duplicate and
 * risk drifting from the real schema and hashing scheme.
 *
 * `process.env.INTEGRATION_TEST_API_TOKEN` set here is inherited by the
 * worker processes/threads Vitest spawns afterwards (globalSetup always
 * completes before any test file runs), so tests/integration/setup/api-client.ts
 * can read it directly.
 */

const TEST_USER_EMAIL = 'test@educorvi.de';
const API_KEY_NAME = 'integration-tests';

export default async function setup() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    // Ensures the seeded `test`/`user2` users (and demo groups/forms) exist,
    // exactly like a fresh dev database would get — idempotent, skipped if
    // the DB already has data.
    await seed(AppDataSource);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneOrFail({
        where: { email: TEST_USER_EMAIL },
    });

    const apiKeyService = new ApiKeyService(AppDataSource);
    const created = await apiKeyService.create(user.id, {
        name: API_KEY_NAME,
    });

    process.env.INTEGRATION_TEST_API_TOKEN = created.token;
    process.env.INTEGRATION_TEST_USER_ID = user.id;

    return async () => {
        await AppDataSource.getRepository(ApiKey).delete({ id: created.id });
        await AppDataSource.destroy();
    };
}
