// Parse and validate CLI arguments
export function parseArgs() {
  const args = process.argv.slice(2);
  const debugFlag = args.includes('--debug');
  const helpFlag = args.includes('--help') || args.includes('-h');
  const databaseFlag = args.includes('--database');
  const noDatabaseFlag = args.includes('--no-database');
  const authFlag = args.includes('--auth');
  const noAuthFlag = args.includes('--no-auth');
  const usefulFlag = args.includes('--useful');
  const noUsefulFlag = args.includes('--no-useful');

  // Extract app name from positional arguments (first non-flag argument)
  const positionalArgs = args.filter((arg) => !arg.startsWith('--'));
  const appNameFromArgs = positionalArgs[0];

  return {
    debugFlag,
    helpFlag,
    databaseFlag,
    noDatabaseFlag,
    authFlag,
    noAuthFlag,
    usefulFlag,
    noUsefulFlag,
    appNameFromArgs,
    args,
  };
}

// Show help message and exit
export function showHelpAndExit() {
  console.log(`
create-addi-stack - Scaffolds an addi-stack app

Usage:
  create-addi-stack [app-name] [options]

Arguments:
  app-name     Name of the app to create (optional, will prompt if not provided)

Options:
  --database, --no-database    Include/Exclude Database (Drizzle ORM)
  --auth, --no-auth            Include/Exclude Authentication (Better Auth)
  --useful, --no-useful       Include/Exclude Useful Packages (runed/neverthrow)
  --debug                      Show verbose output from all commands
  --help, -h                  Show this help message

Examples:
  create-addi-stack                        # Interactive mode with defaults
  create-addi-stack my-app                 # Create app named 'my-app'
  create-addi-stack my-app --database       # Create app with database enabled
  create-addi-stack --no-database --no-auth  # Create without database and auth
  create-addi-stack --debug                # Show verbose output
`);
  // Return early instead of exiting, let caller handle exit
  return { shouldExit: true };
}

// Resolve feature flags based on CLI arguments and prompts
export function resolveFeatureFlags({
  databaseFlag,
  noDatabaseFlag,
  authFlag,
  noAuthFlag,
  usefulFlag,
  noUsefulFlag,
}) {
  let database;
  if (databaseFlag) {
    database = true;
  } else if (noDatabaseFlag) {
    database = false;
  }

  let auth;
  if (authFlag) {
    auth = true;
  } else if (noAuthFlag) {
    auth = false;
  }

  let useful;
  if (usefulFlag) {
    useful = true;
  } else if (noUsefulFlag) {
    useful = false;
  }

  return { database, auth, useful };
}
