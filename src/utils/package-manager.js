import { resolveCommand } from '@sveltejs/sv-utils';

const SUPPORTED = ['pnpm', 'yarn', 'bun', 'deno', 'npm'];

export function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent ?? '';
  return SUPPORTED.find((pm) => userAgent.includes(pm)) ?? 'npm';
}

export function createCommandResolver(packageManager) {
  const resolve = (command, args) => {
    const resolved = resolveCommand(packageManager, command, args);
    if (!resolved) {
      throw new Error(`${packageManager} cannot run '${command}'`);
    }
    return [resolved.command, ...resolved.args];
  };

  return {
    install: () => resolve('install', []),
    add: (packages, { dev = false } = {}) =>
      resolve('add', dev ? ['-D', ...packages] : packages),
    exec: (binary, args = []) => resolve('execute-local', [binary, ...args]),
    runScript: (script) => resolve('run', [script]).join(' '),
  };
}
