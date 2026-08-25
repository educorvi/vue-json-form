import type { DataSource } from 'typeorm';
import { Group } from '@educorvi/vue-json-forms-builder-db-layer';
import { Form } from '@educorvi/vue-json-forms-builder-db-layer';
import { User } from '@educorvi/vue-json-forms-builder-db-layer';
import { Permission } from '@educorvi/vue-json-forms-builder-db-layer';
import { Visibility } from '@educorvi/vue-json-forms-builder-db-layer';
import { E2E_USERS } from './users-constants';
import { Permission as DbPermission } from '@educorvi/vue-json-forms-builder-db-layer';

/**
 * Emails of the Keycloak dev-realm users
 */
const ADMIN_EMAIL = E2E_USERS['admin'].email;
const USER2_EMAIL = E2E_USERS['user2'].email;

type PermissionRole = DbPermission['role'];

interface PermissionSeed {
    userEmail: string;
    role: PermissionRole;
}

interface GroupSeed {
    title: string;
    name: string;
    description?: string;
    parentPath?: string;
    visibility?: Visibility;
    forms?: FormSeed[];
    permissions?: PermissionSeed[];
}

interface FormSeed {
    title: string;
    name: string;
    description?: string;
    visibility?: Visibility;
    permissions?: PermissionSeed[];
}

// ── Helper: batch-insert groups and return a path→entity map ─────────────────

export async function groupSeedToDb(
    dataSource: DataSource,
    groups: GroupSeed[],
    userByEmail: Map<string, User>
): Promise<Map<string, Group>> {
    const treeRepo = dataSource.getTreeRepository(Group);
    const formRepo = dataSource.getRepository(Form);
    const permissionRepo = dataSource.getRepository(Permission);
    const pathMap = new Map<string, Group>();

    // Every seeded row is attributed to the admin user — the audit mappers
    // (server/orpc/mapping/shared.ts) throw when created_by/updated_by is
    // missing, so demo data must carry a real user.
    const auditUser = userByEmail.get(ADMIN_EMAIL);
    if (!auditUser) {
        throw new Error(
            '[seed] Cannot attribute demo data without the admin user'
        );
    }
    const auditRef = { id: auditUser.id };

    for (const s of groups) {
        const parent = s.parentPath
            ? (pathMap.get(s.parentPath) ?? null)
            : null;
        const pathKey = parent ? `${s.parentPath}/${s.name}` : s.name;

        const group = treeRepo.create({
            title: s.title,
            name: s.name,
            description: s.description ?? null,
            visibility: s.visibility ?? Visibility.Visible,
            parent: parent ?? undefined,
            parent_id: parent?.id ?? null,
            created_by: auditRef,
            updated_by: auditRef,
        });
        const saved = await treeRepo.save(group);
        pathMap.set(pathKey, saved);

        // Create group-level permissions
        if (s.permissions) {
            for (const p of s.permissions) {
                const user = userByEmail.get(p.userEmail);
                if (!user) continue;
                const perm = permissionRepo.create({
                    group: { id: saved.id },
                    user: { id: user.id },
                    role: p.role,
                    created_by: auditRef,
                    updated_by: auditRef,
                });
                await permissionRepo.save(perm);
            }
        }

        // Insert any forms nested under this group
        if (s.forms) {
            for (const f of s.forms) {
                const form = formRepo.create({
                    title: f.title,
                    name: f.name,
                    description: f.description ?? null,
                    visibility: f.visibility ?? Visibility.Visible,
                    group: saved,
                    path: `${pathKey}/${f.name}`,
                    created_by: auditRef,
                    updated_by: auditRef,
                });
                await formRepo.save(form);

                // Create form-level permissions
                if (f.permissions) {
                    for (const p of f.permissions) {
                        const user = userByEmail.get(p.userEmail);
                        if (!user) continue;
                        const perm = permissionRepo.create({
                            form: { id: form.id },
                            user: { id: user.id },
                            role: p.role,
                            created_by: auditRef,
                            updated_by: auditRef,
                        });
                        await permissionRepo.save(perm);
                    }
                }
            }
        }
    }

    return pathMap;
}

// ── Seed data definitions ─────────────────────────────────────────────────────

const ROOT_GROUPS: GroupSeed[] = [
    {
        title: 'DGUV',
        name: 'dguv',
        description: 'Unfallversicherungen und Berufsgenossenschaften',
        permissions: [
            { userEmail: ADMIN_EMAIL, role: 'owner' },
            { userEmail: USER2_EMAIL, role: 'guest' },
        ],
    },
    {
        title: 'Educorvi',
        name: 'educorvi',
        description: 'Interne Formulare Educorvi',
        permissions: [{ userEmail: ADMIN_EMAIL, role: 'owner' }],
    },
    {
        title: 'BG Phoenics',
        name: 'bg-phoenics',
        description: 'Formulare BG Phoenics',
        permissions: [{ userEmail: ADMIN_EMAIL, role: 'owner' }],
    },
    {
        title: 'Develop',
        name: 'develop',
        description: 'Entwicklerbereich für Tests, Bug Reports',
        permissions: [{ userEmail: ADMIN_EMAIL, role: 'owner' }],
    },
];

// ── Berufsgenossenschaften (DGUV) ─────────────────────────────────────────────

const BG_GROUPS: GroupSeed[] = [
    {
        title: 'BG Bau',
        name: 'bgbau',
        description: 'Berufsgenossenschaft der Bauwirtschaft',
        parentPath: 'dguv',
        forms: [
            {
                title: 'Baustellenmeldung',
                name: 'baustellenmeldung',
                description: 'Meldung neuer Baustellen',
            },
            {
                title: 'Gefährdungsbeurteilung',
                name: 'gefaehrdungsbeurteilung',
                description:
                    'Vorlage für Gefährdungsbeurteilungen auf Baustellen',
            },
        ],
    },
    {
        title: 'BG ETEM',
        name: 'bgetem',
        description:
            'Berufsgenossenschaft Energie Textil Elektro Medienerzeugnisse',
        parentPath: 'dguv',
        permissions: [{ userEmail: USER2_EMAIL, role: 'editor' }],
        forms: [
            {
                title: 'Unfallanzeige',
                name: 'unfallanzeige',
                description: 'Formular zur Meldung von Arbeitsunfällen',
            },
        ],
    },
    {
        title: 'BG RCI',
        name: 'bgrci',
        description: 'Berufsgenossenschaft Rohstoffe und chemische Industrie',
        parentPath: 'dguv',
    },
    {
        title: 'BG Verkehr',
        name: 'bgverkehr',
        description:
            'Berufsgenossenschaft Verkehrswirtschaft Post-Logistik Telekommunikation',
        parentPath: 'dguv',
    },
    {
        title: 'BGHM',
        name: 'bghm',
        description: 'Berufsgenossenschaft Holz und Metall',
        parentPath: 'dguv',
    },
    {
        title: 'BGHW',
        name: 'bghw',
        description: 'Berufsgenossenschaft Handel und Warenlogistik',
        parentPath: 'dguv',
    },
    {
        title: 'BGN',
        name: 'bgn',
        description: 'Berufsgenossenschaft Nahrungsmittel und Gastgewerbe',
        parentPath: 'dguv',
    },
    {
        title: 'BGW',
        name: 'bgw',
        description:
            'Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege',
        parentPath: 'dguv',
    },
    {
        title: 'UVB',
        name: 'uvb',
        description: 'Unfallversicherung Bund und Bahn',
        parentPath: 'dguv',
    },
    {
        title: 'SVLFG',
        name: 'svlfg',
        description:
            'Sozialversicherung für Landwirtschaft, Forsten und Gartenbau',
        parentPath: 'dguv',
    },
    {
        title: 'VBG',
        name: 'vbg',
        description: 'Verwaltungs-Berufsgenossenschaft',
        parentPath: 'dguv',
    },
];

// ── Unfallkassen (DGUV) ───────────────────────────────────────────────────────

const UK_GROUPS: GroupSeed[] = [
    {
        title: 'Unfallkasse Baden-Württemberg',
        name: 'ukbw',
        description: 'Gesetzliche Unfallversicherung für Baden-Württemberg',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Bayern',
        name: 'ukby',
        description: 'Gesetzliche Unfallversicherung für Bayern',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Berlin',
        name: 'ukbe',
        description: 'Gesetzliche Unfallversicherung für Berlin',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Brandenburg',
        name: 'ukbb',
        description: 'Gesetzliche Unfallversicherung für Brandenburg',
        parentPath: 'dguv',
    },
    {
        title: 'Feuerwehr-Unfallkasse Brandenburg',
        name: 'fuk-bb',
        description:
            'Gesetzliche Unfallversicherung für Feuerwehrangehörige in Brandenburg',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Freie Hansestadt Bremen',
        name: 'ukhb',
        description:
            'Gesetzliche Unfallversicherung für Bremen und Bremerhaven',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Hessen',
        name: 'ukh',
        description: 'Gesetzliche Unfallversicherung für Hessen',
        parentPath: 'dguv',
    },
    {
        title: 'Feuerwehr-Unfallkasse Mitte',
        name: 'fuk-mitte',
        description:
            'Gesetzliche Unfallversicherung für Feuerwehrangehörige in Sachsen-Anhalt und Thüringen',
        parentPath: 'dguv',
    },
    {
        title: 'Feuerwehr-Unfallkasse Niedersachsen',
        name: 'fuk-ni',
        description:
            'Gesetzliche Unfallversicherung für Feuerwehrangehörige in Niedersachsen',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Nord',
        name: 'uknord',
        description:
            'Gesetzliche Unfallversicherung für Hamburg, Schleswig-Holstein und Mecklenburg-Vorpommern',
        parentPath: 'dguv',
    },
    {
        title: 'Hanseatische Feuerwehr-Unfallkasse Nord',
        name: 'hfuk-nord',
        description:
            'Gesetzliche Unfallversicherung für Feuerwehrangehörige in Hamburg, Schleswig-Holstein und Mecklenburg-Vorpommern',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse NRW',
        name: 'uknrw',
        description: 'Gesetzliche Unfallversicherung für Nordrhein-Westfalen',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Rheinland-Pfalz',
        name: 'ukrlp',
        description: 'Gesetzliche Unfallversicherung für Rheinland-Pfalz',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Saarland',
        name: 'uksl',
        description: 'Gesetzliche Unfallversicherung für das Saarland',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Sachsen',
        name: 'uksn',
        description: 'Gesetzliche Unfallversicherung für Sachsen',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Sachsen-Anhalt',
        name: 'ukst',
        description: 'Gesetzliche Unfallversicherung für Sachsen-Anhalt',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse Thüringen',
        name: 'ukth',
        description: 'Gesetzliche Unfallversicherung für Thüringen',
        parentPath: 'dguv',
    },
    {
        title: 'Unfallkasse des Bundes',
        name: 'ukbund',
        description: 'Gesetzliche Unfallversicherung für Bundesbedienstete',
        parentPath: 'dguv',
    },
];

const BGETEM_GROUPS: GroupSeed[] = [
    {
        title: 'Rehabitilation und Leistungen',
        name: 'rul',
        description: 'Formulare für Rehabilitation und Leistungen',
        parentPath: 'dguv/bgetem',
        forms: [
            {
                title: 'Beitragsnachweis',
                name: 'beitragsnachweis',
                description:
                    'Jährlicher Beitragsnachweis für Mitgliedsunternehmen',
                permissions: [{ userEmail: USER2_EMAIL, role: 'owner' }],
            },
            {
                title: 'Rehabilitationsantrag',
                name: 'rehabilitationsantrag',
                description: 'Antrag auf medizinische Rehabilitation',
            },
        ],
    },
    {
        title: 'Mitgliedschaft und Beitrag',
        name: 'mub',
        description: 'Formulare für Mitgliedschaft und Beitrag',
        parentPath: 'dguv/bgetem',
    },
];

// ── Educorvi Sub Groups ────────────────────────────────────────────────────────

const EDUCORVI_GROUPS: GroupSeed[] = [
    {
        title: 'Local Test Backend',
        name: 'local-test-backend',
        description: 'Local Test Backend for testing and development purposes',
        parentPath: 'educorvi',
    },
    {
        title: 'Local Test Backend 2',
        name: 'local-test-backend-2',
        description: 'Local Test Backend for testing and development purposes',
        parentPath: 'educorvi',
    },
    {
        title: 'Testgruppe 1',
        name: 'test1',
        description: 'Untergruppe für Tests',
        parentPath: 'educorvi',
        forms: [
            {
                title: 'Test Survey',
                name: 'test-survey',
                description: 'A simple test survey form',
            },
        ],
    },
    {
        title: 'Testgruppe 2',
        name: 'test2',
        description: 'Untergruppe für Tests',
        parentPath: 'educorvi',
        forms: [
            {
                title: 'QA Checklist',
                name: 'qa-checklist',
                description: 'Quality assurance checklist for testing',
            },
        ],
    },
    {
        title: 'Onboarding',
        name: 'onboarding',
        description: 'Formulare für das Onboarding neuer Mitarbeiter',
        parentPath: 'educorvi',
        forms: [
            {
                title: 'Onboarding 01',
                name: 'onboarding01',
                description:
                    'Beispiel-Formular für das Onboarding neuer Mitarbeiter',
            },
            {
                title: 'Equipment Request',
                name: 'equipment-request',
                description:
                    'Bestellung von Arbeitsmitteln für neue Mitarbeiter',
            },
        ],
    },
];

// ── Development Sub Groups (public) ───────────────────────────────────────────

const DEV_GROUPS: GroupSeed[] = [
    {
        title: 'Bug Report',
        name: 'bug-report',
        description:
            'Gruppe zum Reproduzieren von Bugs und Problemen, z.B. aus Supporttickets.',
        parentPath: 'develop',
        forms: [
            {
                title: 'Example Bug Report',
                name: 'example-bug-report',
                description: 'Report a software bug',
            },
            {
                title: 'Feedback Form',
                name: 'feedback-form',
                description: 'General feedback and feature requests',
            },
        ],
    },
    {
        title: 'New Features',
        name: 'nw-features',
        description: 'Gruppe zum Entwickeln und Testen neuer Features.',
        parentPath: 'develop',
        forms: [
            {
                title: 'Feature: Dynamic Sections',
                name: 'feature-dynamic-sections',
                description: 'Test form for dynamic section add/remove',
            },
        ],
    },
    {
        title: 'Sandbox',
        name: 'sandbox',
        description:
            'Gruppe zum Testen von Ideen, Prototypen und Experimenten.',
        parentPath: 'develop',
        forms: [
            {
                title: 'Prototype: Contact Form',
                name: 'prototype-contact',
                description: 'Prototype for a contact form layout',
            },
            {
                title: 'UI Component Test',
                name: 'ui-component-test',
                description: 'Form to test various UI components and layouts',
            },
        ],
    },
];

// ── Private test groups (visibility-based access control) ─────────────────────

const PRIVATE_TEST_GROUPS: GroupSeed[] = [
    {
        title: 'Test Group Access',
        name: 'test-group-access',
        description:
            'Private Gruppe — Testnutzer hat Zugriff (via Berechtigung).',
        parentPath: 'develop',
        visibility: Visibility.Private,
        permissions: [{ userEmail: ADMIN_EMAIL, role: 'owner' }],
        forms: [
            {
                title: 'Confidential Report',
                name: 'confidential-report',
                description:
                    'Internes Formular — nur für berechtigte Nutzer sichtbar.',
                visibility: Visibility.Private,
            },
            {
                title: 'Member Bulletin',
                name: 'member-bulletin',
                description: 'Rundschreiben für Gruppenmitglieder.',
                visibility: Visibility.Private,
            },
        ],
    },
    {
        title: 'Test Group No Access',
        name: 'test-group-no-access',
        description: 'Private Gruppe — Testnutzer hat KEINEN Zugriff.',
        parentPath: 'develop',
        visibility: Visibility.Private,
        forms: [
            {
                title: 'Restricted Document',
                name: 'restricted-document',
                description:
                    'Streng vertrauliches Formular — nicht für den Testnutzer.',
                visibility: Visibility.Private,
            },
        ],
    },
];

export const DEV_GROUPS_ALL: GroupSeed[] = [
    ...ROOT_GROUPS,
    ...BG_GROUPS,
    ...UK_GROUPS,
    ...EDUCORVI_GROUPS,
    ...DEV_GROUPS,
    ...BGETEM_GROUPS,
    ...PRIVATE_TEST_GROUPS,
];
