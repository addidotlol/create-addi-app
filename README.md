# create-addi-app

An interactive CLI that scaffolds an `addi-stack` app using modern web technologies.

## 🚀 What's Included

- **SvelteKit** - Full-stack web framework
- **Cloudflare Workers** - Edge computing platform
- **Cloudflare D1** - SQLite database
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Authentication solution
- **shadcn-svelte** - Component library
- **Tailwind CSS** - Utility-first CSS framework

## 🌟 Features

- **Package Manager Agnostic** - Works with npm, pnpm, yarn, bun, and deno
- **Cross-Platform** - Windows, macOS, and Linux support
- **Interactive & Non-Interactive Modes** - CLI flags for automation
- **TypeScript Support** - Full TypeScript integration
- **Modern Tooling** - ESLint, Prettier, and dev tools pre-configured

## 🛠️ Platform Support

This CLI works on Windows, macOS, and Linux. On Windows, the CLI automatically handles path spaces and uses appropriate command execution to ensure compatibility.

## 📦 Installation & Usage

Using your favorite package manager (npm, pnpm, yarn, bun, deno) run the following command:

```bash
npm|pnpm|yarn|bun|deno create addi-app
```

## ⚙️ CLI Options

The CLI supports both interactive and non-interactive modes. You can specify an app name as a positional argument and use flags to skip prompts.

### Arguments

- `app-name` - Name of the app to create (optional, will prompt if not provided)

### Options

- `--database, --no-database` - Include/Exclude Database (Drizzle ORM)
- `--auth, --no-auth` - Include/Exclude Authentication (Better Auth)
- `--useful, --no-useful` - Include/Exclude Useful Packages (runed/neverthrow)
- `--debug` - Show verbose output from all commands (useful for troubleshooting)
- `--help, -h` - Show help message

### Examples

```bash
# Interactive mode with defaults
npm create addi-app

# Create app named 'my-app'
npm create addi-app my-app

# Create app with specific options
npm create addi-app my-app --database --no-auth

# Non-interactive with all options
npm create addi-app --no-database --no-useful

# Show help
npm create addi-app --help

# Debug mode (verbose output)
npm create addi-app --debug
```

## 🐛 Troubleshooting

If you encounter issues, use the `--debug` flag to see verbose output from all commands, which can help identify specific problems:

```bash
npm create addi-app --debug
```

## 📁 Project Structure

Once your app is created, you'll get a well-structured project with:

```
my-app/
├── src/
│   ├── lib/
│   │   ├── components/     # shadcn-svelte components
│   │   ├── server/         # Server-side code
│   │   │   ├── db/        # Database setup (if enabled)
│   │   │   └── auth.ts    # Authentication config (if enabled)
│   │   └── utils.ts       # Utility functions
│   ├── routes/             # SvelteKit routes
│   ├── app.html           # App shell
│   └── app.d.ts           # Type declarations
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── drizzle.config.ts      # If database enabled
└── wrangler.toml          # Cloudflare config
```

## 🤝 Contributing

This is a CLI tool for scaffolding the `addi-stack`. Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://better-auth.com/)
- [shadcn-svelte](https://www.shadcn-svelte.com/)
