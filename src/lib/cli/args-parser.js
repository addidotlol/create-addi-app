import { parseArgs as parseNodeArgs } from 'node:util';

const HELP_TEXT = `
create-addi-app - Scaffolds an addi-app

Usage:
  create-addi-app [app-name] [options]

Arguments:
  app-name     Name of the app to create (optional, will prompt if not provided)

Options:
  --database, --no-database    Include/Exclude Database (Drizzle ORM)
  --auth, --no-auth            Include/Exclude Authentication (Better Auth)
  --useful, --no-useful        Include/Exclude Useful Packages (runed/neverthrow)
  --debug                      Show verbose output from all commands
  --help, -h                   Show this help message

Examples:
  create-addi-app                          # Interactive mode with defaults
  create-addi-app my-app                   # Create app named 'my-app'
  create-addi-app my-app --database        # Create app with database enabled
  create-addi-app --no-database --no-auth  # Create without database and auth
  create-addi-app --debug                  # Show verbose output
`;

function resolveToggle(values, name) {
  if (values[name]) return true;
  if (values[`no-${name}`]) return false;
  return undefined;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const { values, positionals } = parseNodeArgs({
    args: argv,
    options: {
      database: { type: 'boolean' },
      'no-database': { type: 'boolean' },
      auth: { type: 'boolean' },
      'no-auth': { type: 'boolean' },
      useful: { type: 'boolean' },
      'no-useful': { type: 'boolean' },
      debug: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });

  return {
    appName: positionals[0],
    database: resolveToggle(values, 'database'),
    auth: resolveToggle(values, 'auth'),
    useful: resolveToggle(values, 'useful'),
    debug: values.debug ?? false,
    help: values.help ?? false,
  };
}

export function getHelpText() {
  return HELP_TEXT;
}
