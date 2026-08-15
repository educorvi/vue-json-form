/**
 * useAppBreadcrumb — Centralized breadcrumb management.
 *
 * Each page calls `useAppBreadcrumb().set()` once during setup.
 * The BasePage component reads `trail` reactively to render the breadcrumb.
 *
 * Icons are only applied to root entity entries (groups, forms, users)
 * via the ENTITY_CONFIG. Dynamic entries (ancestor paths, entity names)
 * are text-only.
 */

export interface BreadcrumbItem {
    label: string;
    route?: string;
    icon?: string;
}

type EntityType = keyof typeof ENTITY_CONFIG;

const ENTITY_CONFIG = {
    groups: { labelKey: 'nav.groups', icon: 'ph:folder', route: '/groups' },
    forms: { labelKey: 'nav.forms', icon: 'ph:file-text', route: '/forms' },
    users: { labelKey: 'nav.users', icon: 'ph:users', route: '/users' },
    apiKeys: { labelKey: 'nav.apiKeys', icon: 'ph:key', route: '/api-keys' },
} as const;

export function useAppBreadcrumb() {
    const { t } = useI18n();
    const trail = useState<BreadcrumbItem[]>('breadcrumb-trail', () => []);

    /**
     * Set the breadcrumb trail for the current page.
     *
     * @param entityType  - Which root entity we're browsing (groups, forms, users).
     * @param entity      - Optional entity/parent with parent_path for ancestor resolution.
     * @param pageTitle   - Optional title for the current page (appended as last item).
     */
    function set(
        entityType: EntityType,
        entity?: Record<string, any> | null,
        pageTitle?: string
    ): void {
        const config = ENTITY_CONFIG[entityType];
        const items: BreadcrumbItem[] = [
            {
                label: t(config.labelKey),
                route: config.route,
                icon: config.icon,
            },
        ];

        if (entity) {
            // Ancestor path entries — text only, no icons
            if (entity.parent_path) {
                const segs: string[] = [];
                for (const entry of entity.parent_path) {
                    segs.push(entry.path_segment ?? entry.name);
                    items.push({
                        label: entry.name,
                        route: `/groups/detail?path=${encodeURIComponent(segs.join('/'))}`,
                    });
                }
            }

            // The entity itself — text only
            const entityLabel = entity.title || entity.name || `#${entity.id}`;
            let entityRoute: string | undefined;
            if (entityType === 'groups') {
                const path = buildGroupUrlPath(
                    entity.parent_path,
                    entity.name ?? String(entity.id)
                );
                entityRoute = `/groups/detail?path=${encodeURIComponent(path)}`;
            } else if (entityType === 'forms') {
                const path = buildFormUrlPath(entity);
                entityRoute = `/forms/detail?path=${encodeURIComponent(path)}`;
            }
            items.push({ label: entityLabel, route: entityRoute });
        }

        // Current page title (last, active item)
        if (pageTitle) {
            items.push({ label: pageTitle });
        }

        trail.value = items;
    }

    return { trail, set };
}
