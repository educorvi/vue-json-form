/**
 * Role definitions and hierarchy for resource-level permissions.
 *
 * Roles are ordered by privilege: guest < editor < owner.
 * A user with a higher role implicitly has all permissions of lower roles.
 */
export const ROLES = ['owner', 'editor', 'guest'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Role hierarchy index. Higher index = more privileged.
 * owner=2, editor=1, guest=0
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
    owner: 2,
    editor: 1,
    guest: 0,
};

/**
 * Check whether `userRole` satisfies at least the `requiredRole` level.
 * Example: hasRole('owner', 'editor') → true (owner ≥ editor)
 */
export function hasRole(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check whether `userRole` is among or above any of the allowed roles.
 */
export function hasPermission(
    userRole: Role | null | undefined,
    allowedRoles: Role[]
): boolean {
    if (!userRole) return false;
    return allowedRoles.some((r) => hasRole(userRole, r));
}

/**
 * Get the display label for a role.
 */
export function roleLabel(role: Role): string {
    switch (role) {
        case 'owner':
            return 'Owner';
        case 'editor':
            return 'Editor';
        case 'guest':
            return 'Guest';
    }
}

/**
 * Compute the effective role from direct + inherited permissions.
 *
 * Considers expiry dates and visibility-based implicit access.
 * Returns the highest non-expired role found, or null if no access.
 */
export function computeEffectiveRole(
    directPermissions: { role: string; expire?: Date | null }[],
    inheritedPermissions: { role: string; expire?: Date | null }[],
    resourceVisibility: string,
    implicitVisibleRole: Role | null = 'guest'
): Role | null {
    const now = new Date();
    let effective: Role | null =
        resourceVisibility === 'visible' ? implicitVisibleRole : null;

    for (const perm of [...directPermissions, ...inheritedPermissions]) {
        if (perm.expire && perm.expire < now) continue;
        const role = perm.role as Role;
        if (!effective || ROLE_HIERARCHY[role] > ROLE_HIERARCHY[effective]) {
            effective = role;
        }
    }

    return effective;
}
