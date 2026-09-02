import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import { glob } from 'glob';
import { create, add, officialAddons } from 'sv';
import { parse, pnpm } from '@sveltejs/sv-utils';
import { execCommand } from '../../utils/command-executor.js';

const BASE_PACKAGES = [
  'shadcn-svelte',
  'tw-animate-css',
  '@fontsource-variable/inter',
  'tailwind-merge',
  'clsx',
  'tailwind-variants',
  'bits-ui',
  '@lucide/svelte',
];

const SHADCN_COMPONENTS = ['button', 'button-group', 'card', 'separator'];
const THEME_URL = 'https://tweakcn.com/r/themes/amethyst-haze.json';

function findUp(fileName, startDir) {
  let dir = startDir;
  for (;;) {
    const candidate = path.join(dir, fileName);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export class ProjectScaffolder {
  constructor(options) {
    this.templatesPath = options.templatesPath;
    this.targetPath = options.targetPath;
    this.config = options.config;
    this.commands = options.commands;
    this.debug = options.debug;
    this.spinner = options.spinner;
  }

  async run(args) {
    await execCommand(args, { cwd: this.targetPath, debug: this.debug });
  }

  templateFileIsWanted(relPath) {
    const { database, auth } = this.config;
    const databaseOnly = ['drizzle.config.ts', 'src/lib/server/db'];
    const authOnly = [
      'src/lib/server/auth.ts',
      'src/lib/auth.ts',
      'src/lib/server/db/schema/auth.ts',
    ];
    const matches = (prefixes) =>
      prefixes.some((p) => relPath === p || relPath.startsWith(`${p}/`));
    if (!database && matches(databaseOnly)) return false;
    if (!auth && matches(authOnly)) return false;
    return true;
  }

  async initializeSvelteKit() {
    this.spinner?.message('Initializing SvelteKit app...');
    create({
      cwd: this.targetPath,
      name: this.config.appName,
      template: 'minimal',
      types: 'typescript',
    });
  }

  async addSvelteAddons() {
    this.spinner?.message('Adding Svelte add-ons...');
    const { status } = await add({
      addons: {
        prettier: officialAddons.prettier,
        eslint: officialAddons.eslint,
        tailwindcss: officialAddons.tailwindcss,
        sveltekitAdapter: officialAddons.sveltekitAdapter,
      },
      cwd: this.targetPath,
      options: {
        tailwindcss: { plugins: ['typography'] },
        'sveltekit-adapter': { adapter: 'cloudflare', cfTarget: 'workers' },
      },
      packageManager: this.config.packageManager,
    });

    const failed = Object.entries(status).filter(
      ([, result]) => result !== 'success'
    );
    if (failed.length > 0) {
      const reasons = failed.map(
        ([id, cancels]) => `${id}: ${[cancels].flat().join(', ')}`
      );
      throw new Error(`Could not set up add-ons - ${reasons.join('; ')}`);
    }
  }

  async cleanupDefaultApp() {
    this.spinner?.message('Cleaning up default app...');
    await fs.remove(path.join(this.targetPath, 'src', 'routes'));
  }

  async copyTemplateFiles() {
    this.spinner?.message('Copying template files...');
    await fs.copy(this.templatesPath, this.targetPath, {
      filter: (src) => {
        if (src.endsWith('.ejs')) return false;
        return this.templateFileIsWanted(
          path.relative(this.templatesPath, src)
        );
      },
    });
  }

  async renderEjsFiles() {
    const ejsFiles = await glob('**/*.ejs', { cwd: this.templatesPath });
    const outputs = ejsFiles
      .map((ejsFile) => ({ ejsFile, relPath: ejsFile.replace(/\.ejs$/, '') }))
      .filter(({ relPath }) => this.templateFileIsWanted(relPath));

    for (const { ejsFile, relPath } of outputs) {
      const content = await ejs.renderFile(
        path.join(this.templatesPath, ejsFile),
        {
          database: this.config.database,
          auth: this.config.auth,
          useful: this.config.useful,
          appName: this.config.appName,
          packageManager: this.config.packageManager,
        }
      );
      await fs.outputFile(path.join(this.targetPath, relPath), content);
    }
  }

  async configureWrangler() {
    this.spinner?.message('Configuring wrangler...');
    const wranglerConfigPath = path.join(this.targetPath, 'wrangler.jsonc');
    const { data, generateCode } = parse.json(
      await fs.readFile(wranglerConfigPath, 'utf8')
    );

    data.observability = { enabled: true };
    data.upload_source_maps = true;

    data.compatibility_flags ??= [];
    if (!data.compatibility_flags.includes('nodejs_compat')) {
      data.compatibility_flags.push('nodejs_compat');
    }

    if (this.config.database) {
      data.d1_databases = [
        { binding: 'D1', database_name: this.config.appName },
      ];
    }

    await fs.writeFile(wranglerConfigPath, generateCode());
  }

  async allowPnpmBuilds() {
    if (this.config.packageManager !== 'pnpm') return;

    const workspaceFilePath =
      findUp('pnpm-workspace.yaml', this.targetPath) ??
      path.join(this.targetPath, 'pnpm-workspace.yaml');
    const content = (await fs.pathExists(workspaceFilePath))
      ? await fs.readFile(workspaceFilePath, 'utf8')
      : '';

    const updated = pnpm.allowBuilds('esbuild')(content);
    if (updated !== content) {
      await fs.writeFile(workspaceFilePath, updated);
    }
  }

  async installDependencies() {
    this.spinner?.message('Installing dependencies...');
    await this.run(this.commands.install());

    const packages = [...BASE_PACKAGES];
    const devPackages = [];

    if (this.config.database) packages.push('drizzle-orm', 'drizzle-kit');
    if (this.config.auth) {
      packages.push('better-auth');
      devPackages.push('auth');
    }
    if (this.config.useful) packages.push('runed', 'neverthrow');

    await this.run(this.commands.add(packages));
    if (devPackages.length > 0) {
      await this.run(this.commands.add(devPackages, { dev: true }));
    }
  }

  async setupShadcnSvelte() {
    this.spinner?.message('Initializing shadcn-svelte...');
    await this.run(
      this.commands.exec('shadcn-svelte', [
        'init',
        '--preset',
        'b0',
        '--no-deps',
        '--skip-preflight',
        '--overwrite',
        '--base-color',
        'neutral',
        '--css',
        './src/routes/layout.css',
        '--lib-alias=$lib',
        '--components-alias=$lib/components',
        '--utils-alias=$lib/utils',
        '--hooks-alias=$lib/hooks',
        '--ui-alias=$lib/components/ui',
      ])
    );

    this.spinner?.message('Installing theme...');
    await this.run(
      this.commands.exec('shadcn-svelte', [
        'add',
        '--no-deps',
        '--yes',
        '--overwrite',
        THEME_URL,
      ])
    );

    this.spinner?.message('Installing components...');
    await this.run(
      this.commands.exec('shadcn-svelte', [
        'add',
        '--no-deps',
        '--yes',
        ...SHADCN_COMPONENTS,
      ])
    );
  }

  async tuneEslintConfig() {
    const eslintConfigPath = path.join(this.targetPath, 'eslint.config.js');
    if (!(await fs.pathExists(eslintConfigPath))) return;

    const content = await fs.readFile(eslintConfigPath, 'utf8');
    const overrides = `},
\t{ ignores: ['worker-configuration.d.ts'] },
\t{
\t\tfiles: ['src/lib/components/ui/**'],
\t\trules: {
\t\t\t'svelte/no-navigation-without-resolve': 'off'
\t\t}
\t}
);`;
    const tuned = content.replace(/\}\s*\);\s*$/, overrides);
    if (tuned !== content) {
      await fs.writeFile(eslintConfigPath, tuned);
    }
  }

  async generateWranglerTypes() {
    this.spinner?.message('Generating Cloudflare types...');
    await this.run(this.commands.exec('wrangler', ['types']));
  }

  async updatePackageScripts() {
    this.spinner?.message('Finishing up...');
    const packageJsonPath = path.join(this.targetPath, 'package.json');
    const { data, generateCode } = parse.json(
      await fs.readFile(packageJsonPath, 'utf8')
    );
    const run = (script) => this.commands.runScript(script);

    const scripts = {
      dev: 'vite dev',
      build: 'vite build',
      preview: `${run('build')} && wrangler dev`,
      prepare: "svelte-kit sync || echo ''",
      check: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json',
      'check:watch':
        'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch',
      format: 'prettier --write .',
      lint: 'prettier --check . && eslint .',
      'cf:deploy': `${run('build')} && wrangler deploy`,
      'cf:gen': 'wrangler types',
    };

    if (this.config.database) {
      scripts['db:gen'] = 'drizzle-kit generate';
      scripts['db:migrate'] = 'wrangler d1 migrations apply D1 --local';
      scripts['db:migrate:preview'] =
        'wrangler d1 migrations apply D1 --preview';
      scripts['db:migrate:remote'] = 'wrangler d1 migrations apply D1 --remote';
    }

    if (this.config.auth) {
      scripts['auth:gen'] =
        'auth generate --config ./src/lib/server/auth.ts --output ./src/lib/server/db/schema/auth.ts --yes';
      scripts['db:gen'] = `${run('auth:gen')} && drizzle-kit generate`;
    }

    data.scripts = scripts;
    await fs.writeFile(packageJsonPath, generateCode());
  }

  async formatCode() {
    this.spinner?.message('Cleaning up...');
    await this.run(this.commands.exec('prettier', ['--write', '.']));
  }

  async scaffold() {
    await this.initializeSvelteKit();
    await this.addSvelteAddons();
    await this.cleanupDefaultApp();
    await this.copyTemplateFiles();
    await this.renderEjsFiles();
    await this.configureWrangler();
    await this.allowPnpmBuilds();
    await this.installDependencies();
    await this.setupShadcnSvelte();
    await this.tuneEslintConfig();
    await this.generateWranglerTypes();
    await this.updatePackageScripts();
    await this.formatCode();
  }
}
