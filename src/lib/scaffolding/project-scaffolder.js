import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import { glob } from 'glob';
import { create, add, officialAddons } from 'sv';
import { pnpm } from '@sveltejs/sv-utils';
import { execCommand } from '../../utils/command-executor.js';

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
    this.pmCommands = options.pmCommands;
    this.debug = options.debug;
    this.spinner = options.spinner;
  }

  async run(...args) {
    await execCommand(args.flat(), {
      cwd: this.targetPath,
      debug: this.debug,
    });
  }

  exec(binary) {
    return [...this.pmCommands.exec.split(' '), binary];
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
        const relPath = path.relative(this.templatesPath, src);
        if (!this.config.database && relPath === 'drizzle.config.ts')
          return false;
        if (!this.config.database && relPath.startsWith('src/lib/server/db'))
          return false;
        if (!this.config.auth && relPath === 'src/lib/server/auth.ts')
          return false;
        if (!this.config.auth && relPath === 'src/lib/auth.ts') return false;
        return true;
      },
    });
  }

  async renderEjsFiles() {
    const ejsFiles = await glob('**/*.ejs', { cwd: this.templatesPath });

    for (const ejsFile of ejsFiles) {
      const templatePath = path.join(this.templatesPath, ejsFile);
      const outputPath = path.join(
        this.targetPath,
        ejsFile.replace('.ejs', '')
      );

      const content = await ejs.renderFile(templatePath, {
        database: this.config.database,
        auth: this.config.auth,
        useful: this.config.useful,
        appName: this.config.appName,
        packageManager: this.config.packageManager,
        pmCommands: this.pmCommands,
        runPrefix: this.config.runPrefix,
      });

      await fs.writeFile(outputPath, content);
    }
  }

  async configureWrangler() {
    this.spinner?.message('Configuring wrangler...');
    const wranglerConfigPath = path.join(this.targetPath, 'wrangler.jsonc');
    const wranglerConfig = JSON.parse(
      await fs.readFile(wranglerConfigPath, 'utf8')
    );

    wranglerConfig.observability = { enabled: true };
    wranglerConfig.upload_source_maps = true;

    wranglerConfig.compatibility_flags ??= [];
    if (!wranglerConfig.compatibility_flags.includes('nodejs_compat')) {
      wranglerConfig.compatibility_flags.push('nodejs_compat');
    }

    if (this.config.database) {
      wranglerConfig.d1_databases = [
        {
          binding: 'D1',
          database_name: this.config.appName,
        },
      ];
    }

    await fs.writeFile(
      wranglerConfigPath,
      JSON.stringify(wranglerConfig, null, 2)
    );
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
    await this.run(this.pmCommands.install.split(' '));

    const packages = [
      'shadcn-svelte',
      'tw-animate-css',
      '@fontsource-variable/inter',
      'tailwind-merge',
      'clsx',
      'tailwind-variants',
      'bits-ui',
      '@lucide/svelte',
    ];

    if (this.config.database) {
      packages.push('drizzle-orm', 'drizzle-kit');
    }
    if (this.config.auth) {
      packages.push('better-auth');
    }
    if (this.config.useful) {
      packages.push('runed', 'neverthrow');
    }

    await this.run(this.pmCommands.add.split(' '), packages);
  }

  async setupShadcnSvelte() {
    this.spinner?.message('Initializing shadcn-svelte...');
    await this.run(this.exec('shadcn-svelte'), [
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
    ]);

    this.spinner?.message('Installing theme...');
    await this.run(this.exec('shadcn-svelte'), [
      'add',
      '--no-deps',
      '--yes',
      '--overwrite',
      'https://tweakcn.com/r/themes/amethyst-haze.json',
    ]);

    this.spinner?.message('Installing components...');
    await this.run(this.exec('shadcn-svelte'), [
      'add',
      '--no-deps',
      '--yes',
      'button',
      'button-group',
      'card',
      'separator',
    ]);
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
    await this.run(this.exec('wrangler'), ['types']);
  }

  async updatePackageScripts() {
    this.spinner?.message('Finishing up...');
    const packageJsonPath = path.join(this.targetPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const runPrefix = this.config.runPrefix;

    const packageScripts = {
      dev: 'vite dev',
      build: 'vite build',
      preview: `${runPrefix} build && wrangler dev`,
      prepare: "svelte-kit sync || echo ''",
      check: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json',
      'check:watch':
        'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch',
      format: 'prettier --write .',
      lint: 'prettier --check . && eslint .',
      'cf:deploy': `${runPrefix} build && wrangler deploy`,
      'cf:gen': 'wrangler types',
    };

    if (this.config.database) {
      packageScripts['db:gen'] = 'drizzle-kit generate';
      packageScripts['db:migrate'] = 'wrangler d1 migrations apply D1 --local';
      packageScripts['db:migrate:preview'] =
        'wrangler d1 migrations apply D1 --preview';
      packageScripts['db:migrate:remote'] =
        'wrangler d1 migrations apply D1 --remote';

      if (this.config.auth) {
        packageScripts['db:gen'] =
          `${runPrefix} auth:gen && drizzle-kit generate`;
        packageScripts['auth:gen'] =
          `${this.pmCommands.dlx} @better-auth/cli generate --config ./src/lib/server/auth.ts --output ./src/lib/server/db/schema/auth.ts`;
      }
    }

    packageJson.scripts = packageScripts;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async formatCode() {
    this.spinner?.message('Cleaning up...');
    await this.run(this.exec('prettier'), ['--write', '.']);
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
