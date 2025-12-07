#!/usr/bin/env node
import { $ } from "dax-sh";

import { intro, text, confirm, outro, spinner } from "@clack/prompts";
import fs from "fs-extra";
import path from "path";
import ejs from "ejs";
import { glob } from "glob";
import { fileURLToPath } from "url";
import * as jsonc from "jsonc-parser";

// Parse command line arguments
const args = process.argv.slice(2);
const debugFlag = args.includes("--debug");
const helpFlag = args.includes("--help") || args.includes("-h");
const databaseFlag = args.includes("--database");
const noDatabaseFlag = args.includes("--no-database");
const authFlag = args.includes("--auth");
const noAuthFlag = args.includes("--no-auth");
const usefulFlag = args.includes("--useful");
const noUsefulFlag = args.includes("--no-useful");

// Extract app name from positional arguments (first non-flag argument)
const positionalArgs = args.filter((arg) => !arg.startsWith("--"));
const appNameFromArgs = positionalArgs[0];

// Show help and exit if requested
if (helpFlag) {
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
  process.exit(0);
}

// Helper function to conditionally apply quiet mode
function maybeQuiet(command) {
  return debugFlag ? command : command.quiet();
}

// Helper function to execute commands with proper Windows path handling
async function execCommand(cmdString, options = {}) {
  let command;

  if (process.platform === "win32") {
    // On Windows, use cmd.exe to properly handle paths with spaces
    command = $.raw`cmd /c ${cmdString}`;
  } else {
    command = $.raw`sh -c ${cmdString}`;
  }

  // Apply options like cwd if provided
  if (options.cwd) {
    command = command.cwd(options.cwd);
  }

  // Apply stdin if provided
  if (options.stdin) {
    command = command.stdin(options.stdin);
  }

  // Apply quiet mode unless debug is enabled
  return debugFlag ? command : command.quiet();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesPath = path.join(__dirname, "templates");

// Detect package manager from user agent or lockfile
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.includes("pnpm")) return "pnpm";
    if (userAgent.includes("yarn")) return "yarn";
    if (userAgent.includes("bun")) return "bun";
    if (userAgent.includes("deno")) return "deno";
    if (userAgent.includes("npm")) return "npm";
  }

  // Default to npm if cannot detect
  return "npm";
}

// Get package manager specific commands
function getPackageManagerCommands(pm) {
  const commands = {
    npm: {
      install: "npm install",
      add: "npm install",
      exec: "npx",
      run: "npm run",
      dlx: "npx",
    },
    pnpm: {
      install: "pnpm install",
      add: "pnpm install",
      exec: "pnpx",
      run: "pnpm run",
      dlx: "pnpm dlx",
    },
    yarn: {
      install: "yarn install",
      add: "yarn add",
      exec: "yarn dlx",
      run: "yarn run",
      dlx: "yarn dlx",
    },
    bun: {
      install: "bun install",
      add: "bun add",
      exec: "bunx",
      run: "bun run",
      dlx: "bunx",
    },
    deno: {
      install: "deno install",
      add: "deno install",
      exec: "deno run",
      run: "deno task",
      dlx: "deno run",
    },
  };

  return commands[pm] || commands.npm;
}

const packageManager = detectPackageManager();
const pmCommands = getPackageManagerCommands(packageManager);

intro(`create-addi-stack ${debugFlag ? " (debug mode enabled)" : ""}`);

// Determine app name - from CLI arg or prompt
let appName;
if (appNameFromArgs) {
  appName = appNameFromArgs;
  if (fs.existsSync(path.join(process.cwd(), appName))) {
    console.error(`Error: Directory '${appName}' already exists`);
    process.exit(1);
  }
} else {
  appName = await text({
    message: "What is the name of your app?",
    placeholder: "my-app",
    validate: (value) => {
      if (!value) return "App name is required";
      if (fs.existsSync(path.join(process.cwd(), value)))
        return "Directory already exists";
    },
  });
}

// Determine database inclusion - from CLI flags or prompt
let database;
if (databaseFlag) {
  database = true;
} else if (noDatabaseFlag) {
  database = false;
} else {
  database = await confirm({
    message: "Include Database (Drizzle ORM)?",
    initialValue: true,
  });
}

// Determine auth inclusion - from CLI flags or prompt
let auth;
if (authFlag) {
  auth = true;
} else if (noAuthFlag) {
  auth = false;
} else if (database) {
  auth = await confirm({
    message: "Include Authentication (Better Auth)?",
    initialValue: true,
  });
} else {
  auth = false;
}

// Determine useful packages inclusion - from CLI flags or prompt
let useful;
if (usefulFlag) {
  useful = true;
} else if (noUsefulFlag) {
  useful = false;
} else {
  useful = await confirm({
    message: "Include Useful Packages (runed/neverthrow)?",
    initialValue: true,
  });
}

const targetPath = path.join(process.cwd(), appName);

let aspinner = spinner();
aspinner.start("Initializing SvelteKit app....");
const createCmd = `${pmCommands.dlx} create-cloudflare@latest`;
await execCommand(
  `${createCmd} --category web-framework --framework svelte --deploy false --git false ${targetPath} -- --template minimal --types ts --no-add-ons --no-install`,
  { stdin: "y\n" },
);

aspinner.message("Adding dependencies...");
await execCommand(
  `${pmCommands.exec} sv add tailwindcss="plugins:typography" eslint prettier devtools-json --no-git-check --no-install`,
  { cwd: targetPath, stdin: "y\n" },
);

aspinner.message("Cleaning up default app...");
if (process.platform === "win32") {
  await execCommand(`rmdir /s /q "${targetPath}\\src\\routes"`);
  await execCommand(`del /q "${targetPath}\\src\\app.d.ts"`);
} else {
  await execCommand(`rm -rf ${targetPath}/src/routes`);
  await execCommand(`rm -rf ${targetPath}/src/app.d.ts`);
}
// await $`rm -rf ${targetPath}/app.d.ts`;

aspinner.message("Copying template files...");
await fs.copy(templatesPath, targetPath, {
  filter: (src) => {
    if (src.endsWith(".ejs")) return false;
    const relPath = path.relative(templatesPath, src);
    if (!database && relPath.startsWith("src/lib/server/db")) return false;
    if (!auth && relPath === "src/lib/server/auth.ts") return false;
    if (!auth && relPath === "src/lib/auth.ts") return false;
    return true;
  },
});

// Render EJS files
const ejsFiles = await glob("**/*.ejs", { cwd: templatesPath });
for (const ejsFile of ejsFiles) {
  const templatePath = path.join(templatesPath, ejsFile);
  const outputPath = path.join(targetPath, ejsFile.replace(".ejs", ""));
  const runCmd = pmCommands.run.split(" ")[0];
  const runPrefix = packageManager === "deno" ? "deno task" : `${runCmd} run`;
  const content = await ejs.renderFile(templatePath, {
    database,
    auth,
    useful,
    appName,
    packageManager,
    pmCommands,
    runPrefix,
  });
  await fs.writeFile(outputPath, content);
}

aspinner.message("Initializing shadcn-svelte...");
await execCommand(
  `${pmCommands.exec} shadcn-svelte@latest init --no-deps --base-color neutral --css ./src/routes/layout.css --lib-alias="\\$lib" --components-alias="\\$lib/components" --utils-alias="\\$lib/utils" --hooks-alias="\\$lib/hooks" --ui-alias="\\$lib/components/ui"`,
  { cwd: targetPath, stdin: "y\n" },
);
aspinner.message("Installing theme...");
await execCommand(
  `${pmCommands.exec} shadcn-svelte@latest add --no-deps --yes --overwrite https://tweakcn.com/r/themes/amethyst-haze.json`,
  { cwd: targetPath, stdin: "y\n" },
);
aspinner.message("Installing components...");
await execCommand(
  `${pmCommands.exec} shadcn-svelte@latest add --no-deps --yes button button-group card separator`,
  { cwd: targetPath, stdin: "y\n" },
);

aspinner.message("Installing dependencies...");
await execCommand(`${pmCommands.install}`, { cwd: targetPath, stdin: "y\n" });
// Build package list properly
const packages = [
  "tw-animate-css",
  "tailwind-merge",
  "clsx",
  "tailwind-variants",
  "bits-ui",
  "@lucide/svelte",
];

if (database) {
  packages.push("drizzle-orm", "drizzle-kit");
}
if (auth) {
  packages.push("better-auth");
}

await execCommand(`${pmCommands.add} ${packages.join(" ")}`, {
  cwd: targetPath,
  stdin: "y\n",
});

if (database) {
  aspinner.message("Creating bindings...");
  const d1_databases = {
    d1_databases: [
      {
        binding: "D1",
        database_name: appName,
      },
    ],
  };
  const wranglerConfigPath = path.join(targetPath, "wrangler.jsonc");
  const wranglerConfigContent = await fs.readFile(wranglerConfigPath, "utf8");
  let wranglerConfig = jsonc.parse(wranglerConfigContent);

  wranglerConfig = {
    ...wranglerConfig,
    ...d1_databases,
  };
  await fs.writeFile(
    wranglerConfigPath,
    JSON.stringify(wranglerConfig, null, 2),
  );
}

aspinner.message("Finishing up...");
const packageJsonPath = path.join(targetPath, "package.json");
let packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
const runCmd = pmCommands.run.split(" ")[0]; // Get just 'pnpm', 'npm', etc.
const runPrefix = packageManager === "deno" ? "deno task" : `${runCmd} run`;
let packageScripts = {
  dev: "vite dev",
  build: "vite build",
  preview: `${runPrefix} build && wrangler dev`,
  prepare: "svelte-kit sync || echo ''",
  check: "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
  "check:watch":
    "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
  format: "prettier --write .",
  lint: "prettier --check . && eslint .",
  "cf:deploy": `${runPrefix} build && wrangler deploy`,
  "cf:gen": "wrangler types ./src/worker-configuration.d.ts",
};
if (database) {
  packageScripts["db:gen"] = `${runPrefix} auth:gen && drizzle-kit generate`;
  packageScripts["db:migrate"] = "wrangler d1 migrations apply D1 --local";
  packageScripts["db:migrate:preview"] =
    "wrangler d1 migrations apply D1 --preview";
  packageScripts["db:migrate:remote"] =
    "wrangler d1 migrations apply D1 --remote";
  if (auth) {
    packageScripts["auth:gen"] =
      `${pmCommands.dlx} @better-auth/cli generate --config ./src/lib/server/auth.ts --output ./src/lib/server/db/schema/auth.ts`;
  }
}
packageJson.scripts = packageScripts;
await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

aspinner.message("Cleaning up....");
await execCommand(`${pmCommands.exec} prettier -w .`, {
  cwd: targetPath,
  stdin: "y\n",
});

aspinner.stop("Done!");

outro(`App created at ${targetPath}!`);
