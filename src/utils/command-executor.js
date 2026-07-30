import spawn from 'cross-spawn';

export function execCommand(args, options = {}) {
  const [command, ...commandArgs] = args;
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: options.cwd,
      stdio: options.debug ? 'inherit' : 'pipe',
    });

    let output = '';
    child.stdout?.on('data', (chunk) => (output += chunk));
    child.stderr?.on('data', (chunk) => (output += chunk));

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const summary = `'${args.join(' ')}' exited with code ${code}`;
      reject(new Error(output ? `${summary}\n${output}` : summary));
    });
  });
}
