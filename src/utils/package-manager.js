// Detect package manager from user agent or lockfile
export function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.includes('pnpm')) return 'pnpm';
    if (userAgent.includes('yarn')) return 'yarn';
    if (userAgent.includes('bun')) return 'bun';
    if (userAgent.includes('deno')) return 'deno';
    if (userAgent.includes('npm')) return 'npm';
  }

  // Default to npm if cannot detect
  return 'npm';
}

// Get package manager specific commands
export function getPackageManagerCommands(pm) {
  const commands = {
    npm: {
      install: 'npm install',
      add: 'npm install',
      exec: 'npx',
      run: 'npm run',
      dlx: 'npx',
    },
    pnpm: {
      install: 'pnpm install',
      add: 'pnpm install',
      exec: 'pnpx',
      run: 'pnpm run',
      dlx: 'pnpm dlx',
    },
    yarn: {
      install: 'yarn install',
      add: 'yarn add',
      exec: 'yarn dlx',
      run: 'yarn run',
      dlx: 'yarn dlx',
    },
    bun: {
      install: 'bun install',
      add: 'bun add',
      exec: 'bunx',
      run: 'bun run',
      dlx: 'bunx',
    },
    deno: {
      install: 'deno install',
      add: 'deno install',
      exec: 'deno run',
      run: 'deno task',
      dlx: 'deno run',
    },
  };

  return commands[pm] || commands.npm;
}
