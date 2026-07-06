/**
 * Development seed — populates the database with a realistic group/form
 * hierarchy when the DB is empty.
 *
 * Only runs when NODE_ENV === 'development'. Skipped entirely if the
 * "group" table already has rows (idempotent).
 */
import type { DataSource } from 'typeorm';
import { Group } from './entities/Group';
import { Form } from './entities/Form';

interface GroupSeed {
    title: string;
    name: string;
    description?: string;
    parentPath?: string; // path of the parent group, used to look up its ID
}

const ROOT_GROUPS: GroupSeed[] = [
    {
        title: 'DGUV',
        name: 'dguv',
        description: 'Unfallversicherungen und Berufsgenossenschaften',
    },
    {
        title: 'Educorvi',
        name: 'educorvi',
        description: 'Interne Formulare Educorvi',
    },
    {
        title: 'BG Phoenics',
        name: 'bg-phoenics',
        description: 'Formulare BG Phoenics',
    },
    {
        title: 'Develop',
        name: 'develop',
        description: 'Entwicklerbereich für Tests, Bug Reports',
    },
];

// ── Berufsgenossenschaften (DGUV) ─────────────────────────────────────────────

const BG_GROUPS: GroupSeed[] = [
    {
        title: 'BG Bau',
        name: 'bgbau',
        description: 'Berufsgenossenschaft der Bauwirtschaft',
        parentPath: 'dguv',
    },
    {
        title: 'BG ETEM',
        name: 'bgetem',
        description:
            'Berufsgenossenschaft Energie Textil Elektro Medienerzeugnisse',
        parentPath: 'dguv',
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
    },
    {
        title: 'Testgruppe 2',
        name: 'test2',
        description: 'Untergruppe für Tests',
        parentPath: 'educorvi',
    },
    {
        title: 'Onboarding',
        name: 'onboarding',
        description: 'Formulare für das Onboarding neuer Mitarbeiter',
        parentPath: 'educorvi',
    },
];

// ── Development Sub Groups ─────────────────────────────────────────────────────

const DEV_GROUPS: GroupSeed[] = [
    {
        title: 'Bug Report',
        name: 'bug-report',
        description:
            'Gruppe zum Reproduzieren von Bugs und Problemen, z.B. aus Supporttickets.',
        parentPath: 'develop',
    },
    {
        title: 'New Features',
        name: 'nw-features',
        description: 'Gruppe zum Entwickeln und Testen neuer Features.',
        parentPath: 'develop',
    },
    {
        title: 'Sandbox',
        name: 'sandbox',
        description:
            'Gruppe zum Testen von Ideen, Prototypen und Experimenten.',
        parentPath: 'develop',
    },
];

const GROUPS: GroupSeed[] = [
    ...ROOT_GROUPS,
    ...BG_GROUPS,
    ...UK_GROUPS,
    ...EDUCORVI_GROUPS,
    ...DEV_GROUPS,
    ...BGETEM_GROUPS,
];

interface FormSeed {
    title: string;
    name: string;
    description?: string;
    groupPath: string;
}

const FORMS: FormSeed[] = [
    {
        title: 'Example Bug Report',
        name: 'example-bug-report',
        description: 'Report a software bug',
        groupPath: 'bug-report',
    },
    {
        title: 'Onboarding 01',
        name: 'onboarding01',
        description: 'Beipiel-Formular für das Onboarding neuer Mitarbeiter',
        groupPath: 'educorvi/onboarding',
    },
];

export async function seed(dataSource: DataSource): Promise<void> {
    const treeRepo = dataSource.getTreeRepository(Group);
    const formRepo = dataSource.getRepository(Form);

    const existingCount = await treeRepo.count();
    if (existingCount > 0) {
        console.log('[seed] Groups table already has data — skipping seed.');
        return;
    }

    console.log('[seed] Seeding development data…');

    // Build a name → Group map as we insert (keyed by parentPath/name path)
    const pathMap = new Map<string, Group>();

    for (const s of GROUPS) {
        const parent = s.parentPath
            ? (pathMap.get(s.parentPath) ?? null)
            : null;
        const pathKey = parent ? `${s.parentPath}/${s.name}` : s.name;

        const group = treeRepo.create({
            title: s.title,
            name: s.name,
            description: s.description ?? null,
            parent: parent ?? undefined,
            parent_id: parent?.id ?? null,
        });
        const saved = await treeRepo.save(group);
        pathMap.set(pathKey, saved);
    }

    for (const s of FORMS) {
        const group = pathMap.get(s.groupPath) ?? null;
        const form = formRepo.create({
            title: s.title,
            name: s.name,
            description: s.description ?? null,
            group_id: group?.id ?? null,
            path: s.groupPath ? `${s.groupPath}/${s.name}` : s.name,
        });
        await formRepo.save(form);
    }

    console.log(
        `[seed] Done — inserted ${ROOT_GROUPS.length} root groups, ${BG_GROUPS.length} BGs, ${UK_GROUPS.length} UKs, and ${FORMS.length} forms.`
    );
}
