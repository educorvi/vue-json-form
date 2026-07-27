/**
 * Defines which resource visibility levels can satisfy a permission
 * policy without requiring explicit role-based permission.
 *
 * Higher weight = less restrictive:
 *   None    (0) — No visibility level is sufficient. Permission always needed.
 *   Visible (1) — Resources with visibility='visible' satisfy this policy.
 *   Public  (2) — Future: resources with visibility='public' also satisfy.
 *
 * Usage: `ResourceViewPermission` sets grant=Visible so that any
 * visible resource is accessible without an explicit permission entry.
 * `ResourceUpdatePermission` uses None (default) — permission always
 * required regardless of visibility.
 */
export enum VisibilityGrant {
    None = 0,
    Visible = 1,
    // Future: Public = 2,
}

const VISIBILITY_WEIGHT: Record<string, number> = {
    private: 0,
    visible: 1,
    // public: 2,  // future
};

/**
 * Check if a resource's visibility level is sufficient to satisfy a
 * policy's visibility grant threshold.
 */
export function isGrantedByVisibility(
    resourceVisibility: string,
    grant: VisibilityGrant
): boolean {
    if (grant === VisibilityGrant.None) return false;
    const weight = VISIBILITY_WEIGHT[resourceVisibility] ?? 0;
    return weight >= grant;
}
