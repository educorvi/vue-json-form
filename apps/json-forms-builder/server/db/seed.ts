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

const GROUPS: GroupSeed[] = [
    // Root groups
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
        title: 'BG Phoneics',
        name: 'bg-phoneics',
        description: 'Formulare BG Phoneics',
    },
    {
        title: 'Develop',
        name: 'develop',
        description: 'Entwicklerbereich für Tests, Bug Reports',
    },

    // DGUV sub groups
    {
        title: 'BGETEM',
        name: 'bgetem',
        description:
            'formulare für die Berufsgenossenshcaft für Energie Textil Elektro Medienerzeugnisse',
        parentPath: 'dguv',
    },
    {
        title: 'BGHW',
        name: 'bghw',
        description:
            'Formulare für die Berufsgenossenschaft Handel und Warenlogistik',
        parentPath: 'dguv',
    },
    {
        title: 'Rehabitilation und Leistungen',
        name: 'rul',
        description: 'Formulare für Rehabilitation und Leistungen',
        parentPath: 'dguv',
    },
    {
        title: 'Mitgliedschaft und Beitrag',
        name: 'mub',
        description: 'Formulare für Mitgliedschaft und Beitrag',
        parentPath: 'dguv',
    },

    // Educorvi Sub Groups
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

    // Development

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
    const groupRepo = dataSource.getRepository(Group);
    const formRepo = dataSource.getRepository(Form);

    const existingCount = await groupRepo.count();
    if (existingCount > 0) {
        console.log('[seed] Groups table already has data — skipping seed.');
        return;
    }

    console.log('[seed] Seeding development data…');

    // Build a path → Group map as we insert
    const pathMap = new Map<string, Group>();

    for (const s of GROUPS) {
        const parent = s.parentPath
            ? (pathMap.get(s.parentPath) ?? null)
            : null;
        const path = parent ? `${parent.path}/${s.name}` : s.name;

        const group = groupRepo.create({
            title: s.title,
            name: s.name,
            description: s.description ?? null,
            parent_id: parent?.id ?? null,
            path,
        });
        const saved = await groupRepo.save(group);
        pathMap.set(path, saved);
    }

    for (const s of FORMS) {
        const group = pathMap.get(s.groupPath) ?? null;
        const path = group ? `${group.path}/${s.name}` : s.name;

        const form = formRepo.create({
            title: s.title,
            name: s.name,
            description: s.description ?? null,
            group_id: group?.id ?? null,
            path,
        });
        await formRepo.save(form);
    }

    console.log(
        `[seed] Done — inserted ${GROUPS.length} groups and ${FORMS.length} forms.`
    );
}
