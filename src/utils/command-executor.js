import { $ } from 'dax-sh';

// Helper function to execute commands with proper Windows path handling
export async function execCommand(cmdString, options = {}) {
  let command;

  if (process.platform === 'win32') {
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
  return options.debug ? command : command.quiet();
}

// Helper function to conditionally apply quiet mode
export function maybeQuiet(command, debug = false) {
  return debug ? command : command.quiet();
}
