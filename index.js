#!/usr/bin/env node
import { $ } from "dax-sh";

import { intro, text, confirm, outro, spinner } from "@clack/prompts";
import fs from "fs-extra";
import path from "path";
import ejs from "ejs";
import { glob } from "glob";
import { fileURLToPath } from "url";
import * as jsonc from "jsonc-parser";

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

intro("create-addi-stack");

const appName = await text({
  message: "What is the name of your app?",
  placeholder: "my-app",
  validate: (value) => {
    if (!value) return "App name is required";
    if (fs.existsSync(path.join(process.cwd(), value)))
      return "Directory already exists";
  },
});

const database = await confirm({
  message: "Include Database (Drizzle ORM)?",
  initialValue: true,
});

const auth = database
  ? await confirm({
      message: "Include Authentication (Better Auth)?",
      initialValue: true,
    })
  : false;

const useful = await confirm({
  message: "Include Useful Packages (runed/neverthrow)?",
  initialValue: true,
});

const targetPath = path.join(process.cwd(), appName);

let aspinner = spinner();
aspinner.start("Initializing SvelteKit app....");
const createCmd = `${pmCommands.dlx} create-cloudflare@latest`;
await $.raw`${createCmd} --category web-framework --framework svelte --deploy false --git false ${targetPath} -- --template minimal --types ts --no-add-ons --no-install`
  .stdin("y\n")
  .quiet();

aspinner.message("Adding dependencies...");
await $.raw`${pmCommands.exec} sv add tailwindcss="plugins:typography" eslint prettier devtools-json --no-git-check --no-install`
  .cwd(targetPath)
  .stdin("y\n")
  .quiet();

aspinner.message("Cleaning up default app...");
await $`rm -rf ${targetPath}/src/routes`.quiet();
await $`rm -rf ${targetPath}/src/app.d.ts`.quiet();
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
await $.raw`${pmCommands.exec} shadcn-svelte@latest init --no-deps --base-color neutral --css ./src/app.css --lib-alias="\\$lib" --components-alias="\\$lib/components" --utils-alias="\\$lib/utils" --hooks-alias="\\$lib/hooks" --ui-alias="\\$lib/components/ui"`
  .cwd(targetPath)
  .stdin("y\n")
  .quiet();
aspinner.message("Installing theme...");
await $.raw`${pmCommands.exec} shadcn-svelte@latest add --no-deps --yes --overwrite https://tweakcn.com/r/themes/amethyst-haze.json`
  .cwd(targetPath)
  .stdin("y\n")
  .quiet();

aspinner.message("Installing components...");
await $.raw`${pmCommands.exec} shadcn-svelte@latest add --no-deps --yes button button-group card separator`
  .cwd(targetPath)
  .stdin("y\n")
  .quiet();

aspinner.message("Installing dependencies...");
await $.raw`${pmCommands.install}`.cwd(targetPath).stdin("y\n").quiet();
await $.raw`${pmCommands.add} tw-animate-css tailwind-merge clsx tailwind-variants bits-ui @lucide/svelte ${database ? ["drizzle-orm", "drizzle-kit"] : ""} ${auth ? "better-auth" : ""}`
  .cwd(targetPath)
  .stdin("y\n")
  .quiet();

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
await $.raw`${pmCommands.exec} prettier -w .`
  .cwd(targetPath)
  .stdin("y\n")
  .quiet();

aspinner.stop("Done!");

outro(`App created at ${targetPath}!`);
