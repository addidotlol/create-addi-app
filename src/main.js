import {
  intro,
  outro,
  spinner,
  text,
  confirm,
  isCancel,
  cancel,
} from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs, getHelpText } from './lib/cli/args-parser.js';
import {
  detectPackageManager,
  createCommandResolver,
} from './utils/package-manager.js';
import { ProjectScaffolder } from './lib/scaffolding/project-scaffolder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesPath = path.join(__dirname, '..', 'templates');

function ensureNotCancelled(value) {
  if (isCancel(value)) {
    cancel('Cancelled.');
    process.exit(0);
  }
  return value;
}

function appNameError(value) {
  if (!value) return 'App name is required';
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(value))
    return 'App name must be lowercase letters, numbers, ".", "_", or "-", and start with a letter or number';
  if (fs.existsSync(path.join(process.cwd(), value)))
    return 'Directory already exists';
}

async function main() {
  let parsedArgs;
  try {
    parsedArgs = parseArgs();
  } catch (error) {
    console.error(error.message);
    console.log(getHelpText());
    process.exit(1);
  }

  if (parsedArgs.help) {
    console.log(getHelpText());
    process.exit(0);
  }

  intro(`create-addi-app${parsedArgs.debug ? ' (debug mode enabled)' : ''}`);

  const packageManager = detectPackageManager();
  const commands = createCommandResolver(packageManager);

  let appName = parsedArgs.appName;
  if (appName) {
    const error = appNameError(appName);
    if (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  } else {
    appName = ensureNotCancelled(
      await text({
        message: 'What is the name of your app?',
        placeholder: 'my-app',
        validate: appNameError,
      })
    );
  }

  let { database, auth, useful } = parsedArgs;

  if (database === undefined) {
    database = ensureNotCancelled(
      await confirm({
        message: 'Include Database (Drizzle ORM)?',
        initialValue: true,
      })
    );
  }

  if (auth === undefined) {
    auth = database
      ? ensureNotCancelled(
          await confirm({
            message: 'Include Authentication (Better Auth)?',
            initialValue: true,
          })
        )
      : false;
  }

  if (auth && !database) {
    console.error(
      'Error: authentication requires the database, enable it or drop --auth'
    );
    process.exit(1);
  }

  if (useful === undefined) {
    useful = ensureNotCancelled(
      await confirm({
        message: 'Include Useful Packages (runed/neverthrow)?',
        initialValue: true,
      })
    );
  }

  const targetPath = path.join(process.cwd(), appName);

  const config = { appName, database, auth, useful, packageManager };

  const aspinner = spinner();
  aspinner.start('Creating your addi-app...');

  const scaffolder = new ProjectScaffolder({
    templatesPath,
    targetPath,
    config,
    commands,
    debug: parsedArgs.debug,
    spinner: aspinner,
  });

  try {
    await scaffolder.scaffold();
    aspinner.stop('Done!');
    outro(`App created at ${targetPath}!`);
  } catch (error) {
    aspinner.error('Failed!');
    console.error('Error creating app:', error.message);
    if (parsedArgs.debug) {
      console.error(error);
      console.error(`Keeping ${targetPath} for inspection.`);
    } else {
      await fs.remove(targetPath);
    }
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error('Unhandled rejection:', message);
  process.exit(1);
});

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
