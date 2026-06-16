#!/usr/bin/env tsx
/**
 * Sync DGUV design tokens into the dguv-theme CSS file.
 *
 * Reads from the dguv-design-system repository — two sources supported
 * (first one found wins):
 *
 *   1. figma-sync generated output (preferred, most up-to-date):
 *      <repo>/figma-sync/output/foundation/dguv-light/tokens.css
 *
 *   2. vanilla-sass applied foundation tokens (fallback):
 *      <repo>/vanilla-sass/src/styles/variables/foundation/
 *      (_ref-tokens.scss + _sys-tokens.scss + _comp-tokens.scss)
 *
 * The repo location is resolved in this order:
 *   1. CLI flag:  --dguv-repo /absolute/or/relative/path
 *   2. Env var:   DGUV_DESIGN_SYSTEM_PATH=/absolute/path
 *   3. Default:   <workspace-root>/extern/dguv-design-system
 *
 * Run:
 *   cd packages/dguv-theme && yarn sync-tokens
 *   cd packages/dguv-theme && yarn sync-tokens --dguv-repo ../../my-fork/dguv-design-system
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Resolve workspace root (3 levels up from scripts/: scripts→dguv-theme→packages→workspace) ─
const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');
const OUT = path.resolve(__dirname, '../src/styles/dguv-design-tokens.css');

// ── Resolve dguv-design-system repo path ────────────────────────────────────
function resolveDguvRepo(): string {
    // 1. CLI flag --dguv-repo <path>
    const flagIdx = process.argv.indexOf('--dguv-repo');
    if (flagIdx !== -1 && process.argv[flagIdx + 1]) {
        const p = process.argv[flagIdx + 1];
        // Relative paths resolve from workspace root (not the package dir) so that
        // `yarn sync-tokens --dguv-repo extern/dguv-design-system` works from anywhere
        return path.isAbsolute(p) ? p : path.resolve(WORKSPACE_ROOT, p);
    }

    // 2. Env var
    if (process.env.DGUV_DESIGN_SYSTEM_PATH) {
        return process.env.DGUV_DESIGN_SYSTEM_PATH;
    }

    // 3. Default: extern/dguv-design-system relative to workspace root
    return path.join(WORKSPACE_ROOT, 'extern/dguv-design-system');
}

// ── Source readers ───────────────────────────────────────────────────────────
function tryFigmaSyncOutput(dguvRepo: string): string | null {
    const p = path.join(
        dguvRepo,
        'figma-sync/output/foundation/dguv-light/tokens.css'
    );
    if (!fs.existsSync(p)) return null;

    const content = fs.readFileSync(p, 'utf8');
    return (
        `/* AUTO-GENERATED from Figma via figma-sync output.\n` +
        ` * Do not edit manually. Run: yarn sync-tokens\n` +
        ` * Source: ${path.relative(WORKSPACE_ROOT, p)}\n` +
        ` */\n\n` +
        content
    );
}

function tryVanillaSassFallback(dguvRepo: string): string {
    const base = path.join(
        dguvRepo,
        'vanilla-sass/src/styles/variables/foundation'
    );

    const files = [
        { file: '_ref-tokens.scss', label: 'Ref tokens' },
        { file: '_sys-tokens.scss', label: 'Sys tokens' },
        { file: '_comp-tokens.scss', label: 'Comp tokens' },
    ];

    let combined =
        `/* AUTO-GENERATED from DGUV vanilla-sass foundation tokens.\n` +
        ` * Do not edit manually. Run: yarn sync-tokens\n` +
        ` * Source: ${path.relative(WORKSPACE_ROOT, base)}/\n` +
        ` */\n\n`;

    for (const { file, label } of files) {
        const filePath = path.join(base, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(
                `Token file not found: ${filePath}\n` +
                    `Check the --dguv-repo path or DGUV_DESIGN_SYSTEM_PATH env var.`
            );
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/:root\s*\{([\s\S]*)\}/);
        if (!match) throw new Error(`No :root block found in ${file}`);

        const bar = '─'.repeat(70 - label.length);
        combined += `/* ── ${label} ${bar} */\n:root {\n${match[1].trimEnd()}\n}\n\n`;
    }

    return combined;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
    const dguvRepo = resolveDguvRepo();

    if (!fs.existsSync(dguvRepo)) {
        console.error(
            `ERROR: dguv-design-system repo not found at: ${dguvRepo}\n` +
                `Use --dguv-repo <path> or set DGUV_DESIGN_SYSTEM_PATH.`
        );
        process.exit(1);
    }

    console.log(
        `Using dguv-design-system repo: ${path.relative(WORKSPACE_ROOT, dguvRepo) || dguvRepo}`
    );

    let content = tryFigmaSyncOutput(dguvRepo);
    let source: string;

    if (content) {
        source = 'Figma sync output';
    } else {
        console.log(
            'Figma sync output not found, falling back to vanilla-sass...'
        );
        content = tryVanillaSassFallback(dguvRepo);
        source = 'vanilla-sass foundation files';
    }

    fs.writeFileSync(OUT, content, 'utf8');
    const lines = content.split('\n').length;
    const rel = path.relative(WORKSPACE_ROOT, OUT);
    console.log(`✓ Written ${lines} lines to ${rel}`);
    console.log(`  Source: ${source}`);
}

main();
