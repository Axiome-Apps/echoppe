#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { cancel, confirm, intro, isCancel, note, outro, spinner, text } from '@clack/prompts';

const DEFAULT_NAME = 'ma-boutique';
const DEFAULT_API_URL = 'http://localhost:7532';
const NAME_PATTERN = /^[a-z0-9-]+$/;

const templateDir = resolve(dirname(fileURLToPath(import.meta.url)), '../template');

function bail(message: string): never {
  cancel(message);
  process.exit(1);
}

/** Contenu du .env généré : front + backend (compose), clé de chiffrement incluse. */
function buildEnv(apiUrl: string, encryptionKey: string): string {
  return `# ─── Front (Astro + SDK) ────────────────────────────────────────────────
# URL de l'API interrogée par la boutique (SSR + images).
PUBLIC_API_URL=${apiUrl}

# ─── Version des images Échoppe (backend, cf. compose.yaml) ─────────────
ECHOPPE_VERSION=latest

# ─── Base de données ────────────────────────────────────────────────────
POSTGRES_USER=echoppe
POSTGRES_PASSWORD=echoppe
POSTGRES_DB=echoppe

# ─── Ports exposés sur l'hôte ───────────────────────────────────────────
API_PORT=7532
ADMIN_PORT=3211

# URL publique du front, transmise à l'API (CORS / liens absolus).
STORE_URL=http://localhost:4321

# ─── Compte admin — À MODIFIER avant le premier \`docker compose up\` ─────
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me

# Clé de chiffrement — générée automatiquement, gardez-la secrète.
ENCRYPTION_KEY=${encryptionKey}
`;
}

/** Copie le template et le personnalise (nom du projet + URL de l'API + .env). */
async function scaffold(projectName: string, apiUrl: string, targetDir: string): Promise<void> {
  await cp(templateDir, targetDir, { recursive: true });
  // npm supprime les .gitignore des paquets : le template le livre sous _gitignore.
  await rename(join(targetDir, '_gitignore'), join(targetDir, '.gitignore'));

  const pkgPath = join(targetDir, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as { name: string };
  pkg.name = projectName;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  const encryptionKey = randomBytes(32).toString('base64');
  await writeFile(join(targetDir, '.env'), buildEnv(apiUrl, encryptionKey));
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      api: { type: 'string' },
      yes: { type: 'boolean', short: 'y' },
    },
  });

  intro('create-echoppe — nouvelle boutique Astro');

  // Nom du projet : positionnel, sinon prompt.
  let projectName = positionals[0]?.trim();
  if (!projectName) {
    const answer = await text({
      message: 'Nom du projet ?',
      placeholder: DEFAULT_NAME,
      defaultValue: DEFAULT_NAME,
      validate: (value) => {
        const name = (value ?? '').trim();
        if (name && !NAME_PATTERN.test(name)) return 'Minuscules, chiffres et tirets uniquement.';
        return undefined;
      },
    });
    if (isCancel(answer)) bail('Génération annulée.');
    projectName = answer.trim() || DEFAULT_NAME;
  }
  if (!NAME_PATTERN.test(projectName)) {
    bail(`Nom invalide « ${projectName} » : minuscules, chiffres et tirets uniquement.`);
  }

  // URL de l'API : flag --api, sinon prompt.
  let apiUrl = values.api?.trim();
  if (!apiUrl) {
    const answer = await text({
      message: "URL de l'API Échoppe ?",
      placeholder: DEFAULT_API_URL,
      defaultValue: DEFAULT_API_URL,
    });
    if (isCancel(answer)) bail('Génération annulée.');
    apiUrl = answer.trim() || DEFAULT_API_URL;
  }
  apiUrl = apiUrl.replace(/\/+$/, '');

  const targetDir = resolve(process.cwd(), projectName);
  if (existsSync(targetDir)) {
    bail(`Le dossier « ${projectName} » existe déjà.`);
  }

  // Confirmation (sautée avec --yes, pour l'usage non-interactif / CI).
  if (!values.yes) {
    const proceed = await confirm({
      message: `Créer la boutique dans ./${projectName} (API : ${apiUrl}) ?`,
    });
    if (isCancel(proceed) || !proceed) bail('Génération annulée.');
  }

  const progress = spinner();
  progress.start('Génération du projet');
  await scaffold(projectName, apiUrl, targetDir);
  progress.stop('Projet généré');

  note(
    [
      `cd ${projectName}`,
      '',
      '# Backend (API + Admin + DB) — renseignez ADMIN_EMAIL/PASSWORD dans .env',
      'docker compose up -d',
      '',
      '# Front Astro',
      'pnpm install',
      'pnpm dev',
    ].join('\n'),
    'Prochaines étapes',
  );
  outro('Boutique prête. Bon commerce ✦');
}

main().catch((error) => bail(error instanceof Error ? error.message : String(error)));
