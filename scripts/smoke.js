import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const cli = path.join(repoRoot, 'index.js');

const MATRIX = [
  { name: 'bare', flags: ['--no-database', '--no-auth', '--no-useful'] },
  { name: 'database', flags: ['--database', '--no-auth', '--no-useful'] },
  { name: 'auth', flags: ['--database', '--auth', '--no-useful'] },
  { name: 'everything', flags: ['--database', '--auth', '--useful'] },
];

const { values, positionals } = parseArgs({
  options: {
    keep: { type: 'boolean' },
    database: { type: 'boolean' },
    'no-database': { type: 'boolean' },
    auth: { type: 'boolean' },
    'no-auth': { type: 'boolean' },
    useful: { type: 'boolean' },
    'no-useful': { type: 'boolean' },
  },
  allowPositionals: true,
});

const explicitFlags = Object.entries(values)
  .filter(([key, on]) => key !== 'keep' && on)
  .map(([key]) => `--${key}`);

function run(args, cwd) {
  const result = spawnSync(args[0], args.slice(1), { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`'${args.join(' ')}' failed in ${cwd}`);
  }
}

function packageManagerRun(script) {
  const userAgent = process.env.npm_config_user_agent ?? '';
  if (userAgent.includes('pnpm')) return ['pnpm', 'run', script];
  if (userAgent.includes('yarn')) return ['yarn', 'run', script];
  if (userAgent.includes('bun')) return ['bun', 'run', script];
  return ['npm', 'run', script];
}

function scaffoldAndVerify({ name, flags }, parentDir) {
  const appDir = path.join(parentDir, name);
  fs.rmSync(appDir, { recursive: true, force: true });
  console.log(`\n=== ${name}: ${flags.join(' ')}`);
  run(['node', cli, name, '--debug', ...flags], parentDir);
  run(packageManagerRun('lint'), appDir);
  run(packageManagerRun('check'), appDir);
  if (flags.includes('--database')) {
    run(packageManagerRun('db:gen'), appDir);
  }
  run(packageManagerRun('build'), appDir);
}

if (positionals.length > 0) {
  const [name] = positionals;
  scaffoldAndVerify({ name, flags: explicitFlags }, repoRoot);
} else {
  const parentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-addi-app-'));
  try {
    for (const entry of MATRIX) scaffoldAndVerify(entry, parentDir);
    console.log(`\nAll ${MATRIX.length} variants passed.`);
  } finally {
    if (!values.keep) fs.rmSync(parentDir, { recursive: true, force: true });
    else console.log(`Kept scaffolds in ${parentDir}`);
  }
}
