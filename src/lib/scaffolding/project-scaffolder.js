import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import { glob } from 'glob';
import * as jsonc from 'jsonc-parser';
import { execCommand } from '../../utils/command-executor.js';

export class ProjectScaffolder {
  constructor(options) {
    this.templatesPath = options.templatesPath;
    this.targetPath = options.targetPath;
    this.config = options.config;
    this.pmCommands = options.pmCommands;
    this.debug = options.debug;
    this.spinner = options.spinner;
  }

  async initializeSvelteKit() {
    this.spinner?.message('Initializing SvelteKit app....');
    const createCmd = `${this.pmCommands.dlx} create-cloudflare@latest`;
    await execCommand(
      `${createCmd} --category web-framework --framework svelte --deploy false --git false ${this.targetPath} -- --template minimal --types ts --no-add-ons --no-install`,
      { stdin: 'y\n', debug: this.debug }
    );
  }

  async addDependencies() {
    this.spinner?.message('Adding dependencies...');
    await execCommand(
      `${this.pmCommands.exec} sv add tailwindcss="plugins:typography" eslint prettier devtools-json --no-git-check --no-install`,
      { cwd: this.targetPath, stdin: 'y\n', debug: this.debug }
    );
  }

  async cleanupDefaultApp() {
    this.spinner?.message('Cleaning up default app...');
    if (process.platform === 'win32') {
      await execCommand(`rmdir /s /q "${this.targetPath}\\src\\routes"`, {
        debug: this.debug,
      });
      await execCommand(`del /q "${this.targetPath}\\src\\app.d.ts"`, {
        debug: this.debug,
      });
    } else {
      await execCommand(`rm -rf ${this.targetPath}/src/routes`, {
        debug: this.debug,
      });
      await execCommand(`rm -rf ${this.targetPath}/src/app.d.ts`, {
        debug: this.debug,
      });
    }
  }

  async copyTemplateFiles() {
    this.spinner?.message('Copying template files...');
    await fs.copy(this.templatesPath, this.targetPath, {
      filter: (src) => {
        if (src.endsWith('.ejs')) return false;
        const relPath = path.relative(this.templatesPath, src);
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

  async setupShadcnSvelte() {
    // Initialize shadcn-svelte
    this.spinner?.message('Initializing shadcn-svelte...');
    await execCommand(
      `${this.pmCommands.exec} shadcn-svelte@latest init --no-deps --base-color neutral --css ./src/routes/layout.css --lib-alias="\\$lib" --components-alias="\\$lib/components" --utils-alias="\\$lib/utils" --hooks-alias="\\$lib/hooks" --ui-alias="\\$lib/components/ui"`,
      { cwd: this.targetPath, stdin: 'y\n', debug: this.debug }
    );

    // Install theme
    this.spinner?.message('Installing theme...');
    await execCommand(
      `${this.pmCommands.exec} shadcn-svelte@latest add --no-deps --yes --overwrite https://tweakcn.com/r/themes/amethyst-haze.json`,
      { cwd: this.targetPath, stdin: 'y\n', debug: this.debug }
    );

    // Install components
    this.spinner?.message('Installing components...');
    await execCommand(
      `${this.pmCommands.exec} shadcn-svelte@latest add --no-deps --yes button button-group card separator`,
      { cwd: this.targetPath, stdin: 'y\n', debug: this.debug }
    );
  }

  async installDependencies() {
    // Install dependencies first
    this.spinner?.message('Installing dependencies...');
    await execCommand(`${this.pmCommands.install}`, {
      cwd: this.targetPath,
      stdin: 'y\n',
      debug: this.debug,
    });

    // Build package list based on features
    const packages = [
      'tw-animate-css',
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

    // Install additional packages
    await execCommand(`${this.pmCommands.add} ${packages.join(' ')}`, {
      cwd: this.targetPath,
      stdin: 'y\n',
      debug: this.debug,
    });
  }

  async setupDatabase() {
    if (!this.config.database) return;

    this.spinner?.message('Creating bindings...');
    const d1_databases = {
      d1_databases: [
        {
          binding: 'D1',
          database_name: this.config.appName,
        },
      ],
    };

    const wranglerConfigPath = path.join(this.targetPath, 'wrangler.jsonc');
    const wranglerConfigContent = await fs.readFile(wranglerConfigPath, 'utf8');
    let wranglerConfig = jsonc.parse(wranglerConfigContent);

    wranglerConfig = {
      ...wranglerConfig,
      ...d1_databases,
    };

    await fs.writeFile(
      wranglerConfigPath,
      JSON.stringify(wranglerConfig, null, 2)
    );
  }

  async updatePackageScripts() {
    this.spinner?.message('Finishing up...');
    const packageJsonPath = path.join(this.targetPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    const runCmd = this.pmCommands.run.split(' ')[0];
    const runPrefix =
      this.config.packageManager === 'deno' ? 'deno task' : `${runCmd} run`;

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
      'cf:gen': 'wrangler types ./src/worker-configuration.d.ts',
    };

    if (this.config.database) {
      packageScripts['db:gen'] =
        `${runPrefix} auth:gen && drizzle-kit generate`;
      packageScripts['db:migrate'] = 'wrangler d1 migrations apply D1 --local';
      packageScripts['db:migrate:preview'] =
        'wrangler d1 migrations apply D1 --preview';
      packageScripts['db:migrate:remote'] =
        'wrangler d1 migrations apply D1 --remote';

      if (this.config.auth) {
        packageScripts['auth:gen'] =
          `${this.pmCommands.dlx} @better-auth/cli generate --config ./src/lib/server/auth.ts --output ./src/lib/server/db/schema/auth.ts`;
      }
    }

    packageJson.scripts = packageScripts;
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async formatCode() {
    this.spinner?.message('Cleaning up....');
    await execCommand(`${this.pmCommands.exec} prettier -w .`, {
      cwd: this.targetPath,
      stdin: 'y\n',
      debug: this.debug,
    });
  }

  async scaffold() {
    await this.initializeSvelteKit();
    await this.addDependencies();
    await this.cleanupDefaultApp();
    await this.copyTemplateFiles();
    await this.renderEjsFiles();
    await this.setupShadcnSvelte();
    await this.installDependencies();
    await this.setupDatabase();
    await this.updatePackageScripts();
    await this.formatCode();
  }
}
