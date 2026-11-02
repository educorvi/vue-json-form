import { describe, expect, it, vi } from 'vitest';
import {
    resolveCollabDocumentId,
    type ApiClient,
} from '../../../src/api/client';

describe('resolveCollabDocumentId', () => {
    it('passes numeric form IDs through without a backend lookup', async () => {
        const getForm = vi.fn();
        const client = { forms: { get: getForm } } as unknown as ApiClient;

        await expect(resolveCollabDocumentId(client, '42')).resolves.toBe('42');
        expect(getForm).not.toHaveBeenCalled();
    });

    it('resolves a form path to its canonical numeric ID', async () => {
        const getForm = vi.fn().mockResolvedValue({ id: 42 });
        const client = { forms: { get: getForm } } as unknown as ApiClient;

        await expect(
            resolveCollabDocumentId(client, 'groups/example-form')
        ).resolves.toBe('42');
        expect(getForm).toHaveBeenCalledWith({
            params: { id: 'groups/example-form' },
        });
    });
});