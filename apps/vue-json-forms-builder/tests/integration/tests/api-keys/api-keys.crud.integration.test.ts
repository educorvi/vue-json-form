import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProvisionedUser } from '../../../support/provision';
import { provisionUser, resetTestDatabase } from '../../../support/provision';
import { closeTestDataSource, findApiKeyRowById } from '../../../support/db/db';
import { ORPCError } from '@orpc/client';

// data

const API_KEY = {
    name: 'Test API Key',
    description: 'Test key for integration tests',
};

const UPDATED_API_KEY = {
    name: 'Updated API Key',
    description: 'Updated description',
};

const INVALID_API_KEY_ID = '00000000-0000-0000-0000-000000000000';

// tests

describe('API Keys API', () => {
    // Given two users exist (fresh per test)
    let admin: ProvisionedUser;
    let user2: ProvisionedUser;

    beforeEach(async () => {
        admin = await provisionUser({ role: 'admin' });
        user2 = await provisionUser({ role: 'user' });
    });

    // And the database is completely wiped again after each test
    afterEach(async () => {
        await resetTestDatabase();
    });

    describe('creating an API key', () => {
        it('creates an API key and returns it with a token', async () => {
            // When creating an API key
            const key = await admin.client.apiKeys.create({
                body: {
                    name: API_KEY.name,
                    description: API_KEY.description,
                },
            });

            // Then the API returns the key with the submitted fields
            expect(key.id).toBeDefined();
            expect(key.name).toBe(API_KEY.name);
            expect(key.description).toBe(API_KEY.description);
            expect(key.identifier).toMatch(/^fb_/);

            // And the plain-text token is returned exactly once (create only)
            expect(key.token).toBeDefined();
            expect(key.token).toMatch(/^fb_[0-9a-f]+$/);
        });

        it('persists a created API key in the database (hashed, no plain token)', async () => {
            // When creating an API key
            const key = await admin.client.apiKeys.create({
                body: {
                    name: API_KEY.name,
                    description: API_KEY.description,
                },
            });

            // Then the row exists in the database
            const row = await findApiKeyRowById(key.id);
            expect(row).toBeDefined();
            expect(row?.name).toBe(API_KEY.name);
            expect(row?.description).toBe(API_KEY.description);
            expect(row?.user.id).toBe(admin.userId);

            // And only the hash is stored — never the plain token
            expect(row?.hash).toBeDefined();
            expect(row?.hash).not.toContain(key.token);
            expect(row?.identifier).toBe(key.identifier);
        });

        it('rejects an empty API key name', async () => {
            // When creating an API key with an empty name
            // Then the request is rejected
            const { code } = new ORPCError('UNPROCESSABLE_CONTENT');
            await expect(
                admin.client.apiKeys.create({ body: { name: '   ' } })
            ).rejects.toMatchObject({ code });
        });
    });

    describe('expiration dates', () => {
        it('round-trips the expiry date as YYYY-MM-DD on create and list', async () => {
            // Given a key is created with an expiry date
            const key = await admin.client.apiKeys.create({
                body: { name: 'Expiring Key', expires_at: '2030-01-15' },
            });

            // Then the create response contains the date-only string
            expect(key.expires_at).toBe('2030-01-15');

            // And the list response also contains the date-only string
            // (regression: a Date → .toISOString() conversion crashed the list
            // with a 500 and produced an invalid shape)
            const keys = await admin.client.apiKeys.list();
            const listed = keys.find((k) => k.id === key.id);
            expect(listed?.expires_at).toBe('2030-01-15');

            // And keys without an expiry omit the field entirely
            const plain = await admin.client.apiKeys.create({
                body: { name: 'No Expiry' },
            });
            const listedPlain = await admin.client.apiKeys.list();
            const listedPlainKey = listedPlain.find((k) => k.id === plain.id);
            expect(listedPlainKey?.expires_at).toBeUndefined();
        });

        it('persists the expiry date in the database as YYYY-MM-DD', async () => {
            // Given a key is created with an expiry date
            const key = await admin.client.apiKeys.create({
                body: { name: 'Expiring Key', expires_at: '2030-01-15' },
            });

            // Then the database row stores the same date-only string
            const row = await findApiKeyRowById(key.id);
            expect(row?.expires_at).toBe('2030-01-15');
        });
    });

    describe('listing API keys', () => {
        it('lists all API keys of the user', async () => {
            // Given the user created two API keys
            const keyA = await admin.client.apiKeys.create({
                body: { name: 'Key A' },
            });
            const keyB = await admin.client.apiKeys.create({
                body: { name: 'Key B' },
            });

            // When listing the API keys
            const keys = await admin.client.apiKeys.list();

            // Then both keys are returned (newest first)
            const ids = keys.map((k) => k.id);
            expect(ids).toContain(keyA.id);
            expect(ids).toContain(keyB.id);

            // And no plain token is exposed in the list
            for (const k of keys) {
                expect(k).not.toHaveProperty('token');
                expect(k.identifier).toBeDefined();
            }
        });

        it('does not expose the plain token in the list', async () => {
            // Given the user created an API key
            await admin.client.apiKeys.create({
                body: { name: 'Key A' },
            });

            // When listing the API keys
            const keys = await admin.client.apiKeys.list();

            // Then no key has a token property
            expect(keys.every((k) => !('token' in k))).toBe(true);
        });
    });

    describe('editing an API key', () => {
        it('updates the name and description of an API key', async () => {
            // Given an API key exists
            const key = await admin.client.apiKeys.create({
                body: {
                    name: API_KEY.name,
                    description: API_KEY.description,
                },
            });

            // When updating the key
            const updated = await admin.client.apiKeys.patch({
                params: { id: key.id },
                body: {
                    name: UPDATED_API_KEY.name,
                    description: UPDATED_API_KEY.description,
                },
            });

            // Then the API returns the updated key
            expect(updated.id).toBe(key.id);
            expect(updated.name).toBe(UPDATED_API_KEY.name);
            expect(updated.description).toBe(UPDATED_API_KEY.description);
            expect(updated.identifier).toBe(key.identifier);

            // And the update is persisted in the database
            const row = await findApiKeyRowById(key.id);
            expect(row).toBeDefined();
            expect(row?.name).toBe(UPDATED_API_KEY.name);
            expect(row?.description).toBe(UPDATED_API_KEY.description);
        });

        it('rejects updating an empty name', async () => {
            // Given an API key exists
            const key = await admin.client.apiKeys.create({
                body: { name: API_KEY.name },
            });

            // When updating the key with an empty name
            // Then the request is rejected
            const { code } = new ORPCError('UNPROCESSABLE_CONTENT');
            await expect(
                admin.client.apiKeys.patch({
                    params: { id: key.id },
                    body: { name: '   ' },
                })
            ).rejects.toMatchObject({ code });
        });

        it('rejects updating a non-existent API key', async () => {
            // When updating an API key that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                admin.client.apiKeys.patch({
                    params: { id: INVALID_API_KEY_ID },
                    body: { name: 'New Name' },
                })
            ).rejects.toMatchObject({ code });
        });
    });

    describe('deleting an API key', () => {
        it('deletes the API key and it is no longer returned', async () => {
            // Given an API key exists
            const key = await admin.client.apiKeys.create({
                body: { name: API_KEY.name },
            });

            // When deleting the key
            await admin.client.apiKeys.delete({ params: { id: key.id } });

            // Then the key is no longer persisted in the database
            const row = await findApiKeyRowById(key.id);
            expect(row).toBeNull();

            // And the key is no longer returned when listing
            const keys = await admin.client.apiKeys.list();
            expect(keys.some((k) => k.id === key.id)).toBe(false);
        });

        it('rejects deleting a non-existent API key', async () => {
            // When deleting an API key that does not exist
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                admin.client.apiKeys.delete({
                    params: { id: INVALID_API_KEY_ID },
                })
            ).rejects.toMatchObject({ code });
        });
    });

    describe('user isolation', () => {
        it('a user only sees their own API keys', async () => {
            // Given admin and user2 each created an API key
            const adminKey = await admin.client.apiKeys.create({
                body: { name: 'Admin Key' },
            });
            const user2Key = await user2.client.apiKeys.create({
                body: { name: 'User2 Key' },
            });

            // When admin lists their keys
            const adminKeys = await admin.client.apiKeys.list();

            // Then admin only sees their own key
            const adminIds = adminKeys.map((k) => k.id);
            expect(adminIds).toContain(adminKey.id);
            expect(adminIds).not.toContain(user2Key.id);

            // When user2 lists their keys
            const user2Keys = await user2.client.apiKeys.list();

            // Then user2 only sees their own key
            const user2Ids = user2Keys.map((k) => k.id);
            expect(user2Ids).toContain(user2Key.id);
            expect(user2Ids).not.toContain(adminKey.id);
        });

        it("a user cannot edit another user's API key", async () => {
            // Given admin created an API key
            const adminKey = await admin.client.apiKeys.create({
                body: { name: 'Admin Key' },
            });

            // When user2 tries to update admin's key
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                user2.client.apiKeys.patch({
                    params: { id: adminKey.id },
                    body: { name: 'Hacked' },
                })
            ).rejects.toMatchObject({ code });
        });

        it("a user cannot delete another user's API key", async () => {
            // Given admin created an API key
            const adminKey = await admin.client.apiKeys.create({
                body: { name: 'Admin Key' },
            });

            // When user2 tries to delete admin's key
            // Then the request is rejected with a not-found error
            const { code } = new ORPCError('NOT_FOUND');
            await expect(
                user2.client.apiKeys.delete({ params: { id: adminKey.id } })
            ).rejects.toMatchObject({ code });

            // And the key still exists
            const row = await findApiKeyRowById(adminKey.id);
            expect(row).toBeDefined();
        });

        // TODO should a admin user be able to manage other users api keys even though he cant list them? Currently its not possible since the api keys are first filtered by the user id before the admin check.
        // it('an admin user can manage other users API keys', async () => {
        //     // Given user2 created an API key
        //     const user2Key = await user2.client.apiKeys.create({
        //         body: { name: 'User2 Key' },
        //     });

        //     // When admin updates user2's key
        //     const updated = await admin.client.apiKeys.patch({
        //         params: { id: user2Key.id },
        //         body: { name: 'Admin Updated' },
        //     });

        //     // Then the update is persisted
        //     expect(updated.name).toBe('Admin Updated');
        //     const row = await findApiKeyRowById(user2Key.id);
        //     expect(row?.name).toBe('Admin Updated');

        //     // When admin deletes user2's key
        //     await admin.client.apiKeys.delete({ params: { id: user2Key.id } });

        //     // Then the key is deleted
        //     const deletedRow = await findApiKeyRowById(user2Key.id);
        //     expect(deletedRow).toBeNull();
        // });
    });
});

afterAll(async () => {
    await closeTestDataSource();
});

// TODO: api key permission management: maybe simply added for the permission tests so we check the api keys also work for permission management
// TODO: when fine grained access tokens as well as access tokens which limit the maximum access role of resources are implemented, they should be tested here.
