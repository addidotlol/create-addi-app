export function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.includes('pnpm')) return 'pnpm';
    if (userAgent.includes('yarn')) return 'yarn';
    if (userAgent.includes('bun')) return 'bun';
    if (userAgent.includes('deno')) return 'deno';
    if (userAgent.includes('npm')) return 'npm';
  }

  return 'npm';
}

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
      add: 'pnpm add',
      exec: 'pnpm exec',
      run: 'pnpm run',
      dlx: 'pnpm dlx',
    },
    yarn: {
      install: 'yarn install',
      add: 'yarn add',
      exec: 'yarn exec',
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
