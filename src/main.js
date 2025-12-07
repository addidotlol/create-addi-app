import { intro, outro, spinner, text, confirm } from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseArgs,
  showHelpAndExit,
  resolveFeatureFlags,
} from './lib/cli/args-parser.js';
import {
  detectPackageManager,
  getPackageManagerCommands,
} from './utils/package-manager.js';
import { ProjectScaffolder } from './lib/scaffolding/project-scaffolder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesPath = path.join(__dirname, '..', 'templates');

async function main() {
  const parsedArgs = parseArgs();

  // Show help and exit if requested
  if (parsedArgs.helpFlag) {
    showHelpAndExit();
    process.exit(0);
  }

  intro(
    `create-addi-stack ${parsedArgs.debugFlag ? ' (debug mode enabled)' : ''}`
  );

  // Detect package manager and get commands
  const packageManager = detectPackageManager();
  const pmCommands = getPackageManagerCommands(packageManager);

  // Determine app name - from CLI arg or prompt
  let appName;
  if (parsedArgs.appNameFromArgs) {
    appName = parsedArgs.appNameFromArgs;
    if (fs.existsSync(path.join(process.cwd(), appName))) {
      console.error(`Error: Directory '${appName}' already exists`);
      process.exit(1);
    }
  } else {
    appName = await text({
      message: 'What is the name of your app?',
      placeholder: 'my-app',
      validate: (value) => {
        if (!value) return 'App name is required';
        if (fs.existsSync(path.join(process.cwd(), value)))
          return 'Directory already exists';
      },
    });
  }

  // Resolve feature flags from CLI arguments
  let { database, auth, useful } = resolveFeatureFlags(parsedArgs);

  // Prompt for missing feature flags
  if (database === undefined) {
    database = await confirm({
      message: 'Include Database (Drizzle ORM)?',
      initialValue: true,
    });
  }

  if (auth === undefined && database) {
    auth = await confirm({
      message: 'Include Authentication (Better Auth)?',
      initialValue: true,
    });
  } else if (auth === undefined) {
    auth = false;
  }

  if (useful === undefined) {
    useful = await confirm({
      message: 'Include Useful Packages (runed/neverthrow)?',
      initialValue: true,
    });
  }

  const targetPath = path.join(process.cwd(), appName);
  const runCmd = pmCommands.run.split(' ')[0];
  const runPrefix = packageManager === 'deno' ? 'deno task' : `${runCmd} run`;

  // Create project configuration
  const config = {
    appName,
    database,
    auth,
    useful,
    packageManager,
    runPrefix,
  };

  // Scaffold the project
  const aspinner = spinner();
  aspinner.start('Creating your addi-stack app...');

  // Initialize scaffolder
  const scaffolder = new ProjectScaffolder({
    templatesPath,
    targetPath,
    config,
    pmCommands,
    debug: parsedArgs.debugFlag,
    spinner: aspinner,
  });

  try {
    await scaffolder.scaffold();
    aspinner.stop('Done!');
    outro(`App created at ${targetPath}!`);
  } catch (error) {
    aspinner.stop('Failed!');
    console.error('Error creating app:', error.message);
    if (parsedArgs.debugFlag) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
