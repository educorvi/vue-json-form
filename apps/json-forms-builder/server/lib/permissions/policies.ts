/**
 * PermissionPolicy class and all resource-level policy constants.
 *
 * A PermissionPolicy defines:
 *  - Which resource roles are sufficient to perform an action
 *  - Whether resource visibility alone can grant access (visibilityGrant)
 *  - Which global user roles skip the check entirely (skipCheckForRoles)
 *
 * Policies are the ONLY thing endpoints need to reference for access control.
 */
import { type Role, ROLE_HIERARCHY } from './roles';
import { VisibilityGrant, isGrantedByVisibility } from './visibility';

/**
 * Describes what is required to perform a specific action on a resource.
 *
 * @example
 * ```ts
 * // Can this user view this form?
 * ResourceViewPermission.isSatisfiedBy(effectiveRole, form.visibility)
 *
 * // Can this admin skip updating this group?
 * ResourceUpdatePermission.isSkippedForRole(user.role)
 * ```
 */
export class PermissionPolicy {
    /**
     * @param requiredRoles       Resource roles that satisfy this policy
     *                            (e.g. ['owner', 'editor'])
     * @param visibilityGrant     Resource visibility level that grants access
     *                            without needing an explicit permission entry.
     *                            Default: None (permission always required).
     * @param skipCheckForRoles   Global user roles that skip this check entirely.
     *                            Default: ['admin'] — admins bypass all checks.
     */
    constructor(
        public readonly requiredRoles: Role[],
        public readonly visibilityGrant: VisibilityGrant = VisibilityGrant.None,
        public readonly skipCheckForRoles: string[] = ['admin']
    ) {}

    /** Check if a user's global role skips this policy entirely. */
    isSkippedForRole(globalRole: string): boolean {
        return this.skipCheckForRoles.includes(globalRole);
    }

    /** Check if a resource's visibility alone satisfies this policy. */
    isSatisfiedByVisibility(resourceVisibility: string): boolean {
        return isGrantedByVisibility(resourceVisibility, this.visibilityGrant);
    }

    /** Check if an effective resource-role satisfies this policy. */
    isSatisfiedByRole(effectiveRole: Role | null): boolean {
        if (!effectiveRole) return false;
        return this.requiredRoles.some(
            (r) => ROLE_HIERARCHY[effectiveRole] >= ROLE_HIERARCHY[r]
        );
    }

    /**
     * Full check: visibility grant OR explicit role.
     * This is the primary entry point for access decisions.
     */
    isSatisfiedBy(
        effectiveRole: Role | null,
        resourceVisibility: string
    ): boolean {
        return (
            this.isSatisfiedByVisibility(resourceVisibility) ||
            this.isSatisfiedByRole(effectiveRole)
        );
    }
}

// ── Policy constants ─────────────────────────────────────────────────────

/** View a group or form (browse, see metadata, list children) */
export const ResourceViewPermission = new PermissionPolicy(
    ['owner', 'editor', 'guest'],
    VisibilityGrant.Visible // visible resources are viewable without permission
);

/** Update group/form title, description, visibility */
export const ResourceUpdatePermission = new PermissionPolicy(
    ['owner', 'editor']
    // Defaults: visibilityGrant=None, skipCheckForRoles=['admin']
);

/** Delete a group or form entirely */
export const ResourceDeletePermission = new PermissionPolicy(['owner']);

/** Create sub-groups or forms within a group */
export const ResourceCreateChildPermission = new PermissionPolicy([
    'owner',
    'editor',
]);

/** Manage permissions (add/remove/change other users' permissions) */
export const ResourceManagePermissionsPermission = new PermissionPolicy([
    'owner',
]);

/** Manage the schema of a form (import, create versions) */
export const FormSchemaManagePermission = new PermissionPolicy([
    'owner',
    'editor',
]);

/** Create a new form version / release */
export const FormVersionCreatePermission = new PermissionPolicy([
    'owner',
    'editor',
]);
