import type { DataSource } from 'typeorm';
import { Group } from '../entities/Group';
import { Form } from '../entities/Form';
import { User } from '../entities/User';
import jsonSchema from '../entities/seed-data/json-schema.json';
import uiSchema from '../entities/seed-data/ui-schema.json';
import { groupSeedToDb, DEV_GROUPS_ALL } from './dev-data';
import { E2E_USERS } from './users-constants';
import { ensureTestUsers } from './users';

/**
 * Development seed — populates the database with a realistic group/form hierarchy when the group table is empty (used by server/plugins/seed.ts on dev server startup.
 */
export async function seed(dataSource: DataSource): Promise<void> {
    const treeRepo = dataSource.getTreeRepository(Group);

    const existingCount = await treeRepo.count();
    if (existingCount > 0) {
        console.log('[seed] Groups table already has data — skipping seed.');
        return;
    }

    console.log('[seed] Seeding development data…');

    // 1. Create test users (must exist before groups so permissions can
    //    reference them via the inline seed data).
    const { admin, user2 } = await ensureTestUsers(dataSource);
    const userByEmail = new Map<string, User>([
        [E2E_USERS['admin'].email, admin],
        [E2E_USERS['user2'].email, user2],
    ]);

    // 2. Insert all groups and forms — permissions are created inline by
    //    groupSeedToDb based on the `permissions` arrays in the seed data.
    await groupSeedToDb(dataSource, DEV_GROUPS_ALL, userByEmail);

    // 3. Assign seed schemas to a few forms for demo purposes
    await assignDemoSchemas(dataSource);

    const formCount = DEV_GROUPS_ALL.reduce(
        (sum, group) => sum + (group.forms?.length ?? 0),
        0
    );
    console.log(
        `[seed] Done — inserted ${DEV_GROUPS_ALL.length} groups and ${formCount} forms.`
    );
}

/**
 * Assigns the demo JSON/UI schemas (entities/seed-data/*.json) to a few
 * well-known forms so the dev app has working form renderers out of the box.
 */
export async function assignDemoSchemas(dataSource: DataSource): Promise<void> {
    const formRepo = dataSource.getRepository(Form);
    const schemaForms = [
        'unfallanzeige',
        'beitragsnachweis',
        'rehabilitationsantrag',
        'onboarding01',
        'example-bug-report',
    ];
    if (jsonSchema && uiSchema) {
        const schema = { json: jsonSchema, ui: uiSchema };
        for (const formName of schemaForms) {
            const form = await formRepo.findOne({ where: { name: formName } });
            if (form) {
                await formRepo.update(form.id, { schema });
            }
        }
    }
}

export * from './users';
export * from './dev-data';
export * from './test-data';
