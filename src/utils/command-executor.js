import { $ } from 'dax-sh';

export async function execCommand(cmdString, options = {}) {
  let command = $.raw`${cmdString}`;

  if (options.cwd) {
    command = command.cwd(options.cwd);
  }

  if (options.stdin) {
    command = command.stdin(options.stdin);
  }

  return options.debug ? command : command.quiet();
}

export function maybeQuiet(command, debug = false) {
  return debug ? command : command.quiet();
}
