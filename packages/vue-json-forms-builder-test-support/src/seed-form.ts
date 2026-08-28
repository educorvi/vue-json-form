import type { ApiClient } from './api-client';

export interface SeedFormOptions {
    title: string;
    name: string;
    /** Numeric id of the parent group; omit for a root-level form. */
    parentGroupId?: number;
}

export interface SeedFormResult {
    id: number;
    title: string;
    name: string;
}

/**
 * Creates a form via the typed oRPC client (`forms.create`)
 */
export async function seedForm(
    client: ApiClient,
    opts: SeedFormOptions
): Promise<SeedFormResult> {
    const form = await client.forms.create({
        query: { id: opts.parentGroupId ? String(opts.parentGroupId) : '' },
        body: { title: opts.title, name: opts.name },
    });
    return {
        id: form.id,
        title: form.title ?? opts.title,
        name: form.name ?? opts.name,
    };
}

export interface GrantFormPermissionOptions {
    formId: number;
    /** DB user id — the Keycloak `sub` (see zUserShared.id in the orpc contract). */
    userId: string;
    role: 'owner' | 'editor' | 'guest';
}

/**
 * Grants a user a role on a form via the typed oRPC client (`forms.permissions.create`)
 */
export async function grantFormPermission(
    client: ApiClient,
    opts: GrantFormPermissionOptions
): Promise<void> {
    await client.forms.permissions.create({
        params: { id: String(opts.formId) },
        body: { user_id: opts.userId, role: opts.role },
    });
}
