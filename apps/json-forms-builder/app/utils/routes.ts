/**
 * Routes — Central route definitions and helpers for the application.
 *
 * All route building is grouped as static methods on the `Routes` class so
 * helpers are easy to discover, are grouped logically, and cause no naming
 * conflicts with other functions.
 *
 * Usage:
 *   Routes.formsDetail('some/path')         // → /forms/detail?path=...
 *   Routes.groupsEdit('some/path')          // → /groups/edit?path=...
 *   Routes.formsNew(parentPath)             // → /forms/new?parent=...
 *   Routes.formDetailPath(formEntity)       // from entity object
 *   Routes.childItemPath(treeItem)          // from group-tree item
 *   Routes.FORMS                            // static constant
 *   Routes.DASHBOARD                        // static constant
 *
 * All path parameters are URI-encoded automatically.
 */

// ── Entity-like interface for high-level helpers ────────────────────────────

interface EntityLike {
    parent_path?: Array<{ name: string; path_segment?: string }> | null;
    name?: string;
    id?: number;
}

// ── Route helpers ───────────────────────────────────────────────────────────

export class Routes {
    // ═══ Static route constants ═══════════════════════════════════════════════

    static readonly HOME = '/';
    static readonly DASHBOARD = '/dashboard';
    static readonly FORMS = '/forms';
    static readonly FORMS_NEW = '/forms/new';
    static readonly GROUPS = '/groups';
    static readonly GROUPS_NEW = '/groups/new';
    static readonly USERS = '/users';
    static readonly FORM_BUILDER = '/form-builder';
    static readonly SWAGGER = '/_swagger';
    static readonly AUTH_KEYCLOAK = '/auth/keycloak';

    // ═══ Forms ═════════════════════════════════════════════════════════════════

    /** /forms/detail?path=<encoded> */
    static formsDetail(path: string): string {
        return `/forms/detail?path=${encodeURIComponent(path)}`;
    }

    /** /forms/edit?path=<encoded> */
    static formsEdit(path: string): string {
        return `/forms/edit?path=${encodeURIComponent(path)}`;
    }

    /** /forms/new or /forms/new?parent=<encoded> */
    static formsNew(parentPath?: string): string {
        return parentPath
            ? `/forms/new?parent=${encodeURIComponent(parentPath)}`
            : Routes.FORMS_NEW;
    }

    /** /forms/detail?path=<encoded> from a form entity object */
    static formDetailPath(form: EntityLike | null): string {
        if (!form) return '';
        const path = buildFormUrlPath(form as any);
        return path ? Routes.formsDetail(path) : '';
    }

    // ═══ Groups ════════════════════════════════════════════════════════════════

    /** /groups/detail?path=<encoded> */
    static groupsDetail(path: string): string {
        return `/groups/detail?path=${encodeURIComponent(path)}`;
    }

    /** /groups/edit?path=<encoded> */
    static groupsEdit(path: string): string {
        return `/groups/edit?path=${encodeURIComponent(path)}`;
    }

    /** /groups/new or /groups/new?parent=<encoded> */
    static groupsNew(parentPath?: string): string {
        return parentPath
            ? `/groups/new?parent=${encodeURIComponent(parentPath)}`
            : Routes.GROUPS_NEW;
    }

    /** /groups/detail?path=<encoded> from a group entity object */
    static groupDetailPath(group: EntityLike | null): string {
        if (!group) return '';
        const path = buildGroupUrlPath(
            group.parent_path ?? null,
            group.name ?? String(group.id ?? '')
        );
        return path ? Routes.groupsDetail(path) : '';
    }

    // ═══ Child items (group-tree – accepts forms & groups) ════════════════════

    /** Link for a child item in a group tree (both forms & groups). */
    static childItemPath(item: {
        type?: 'form' | 'group';
        parent_path?: Array<{ name: string; path_segment?: string }> | null;
        name?: string;
        id?: number;
    }): string {
        const segments: string[] = [];
        if (item.parent_path) {
            for (const entry of item.parent_path) {
                segments.push(entry.path_segment ?? entry.name);
            }
        }
        segments.push(item.name ?? String(item.id));
        const path = segments.join('/');
        return item.type === 'form'
            ? Routes.formsDetail(path)
            : Routes.groupsDetail(path);
    }
}
