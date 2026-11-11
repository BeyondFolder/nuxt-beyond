# Contributing to NuxtBeyond

Thanks for helping improve NuxtBeyond. Bug reports, fixes, docs improvements, and new ideas are all welcome.

## Getting set up

```bash
git clone https://github.com/BeyondFolder/nuxt-beyond.git
cd nuxt-beyond
nvm use              # Node version from .nvmrc
npm ci
cp .env.example .env
npm run dev
```

Features that call external services (Google sign-in, AI, email, billing, Turnstile, AutoRAG) need keys in your `.env`. Use test or sandbox keys where possible, and never commit `.env` or any secret.

## Before you open a pull request

Run the same checks as CI:

```bash
npm run lint:ci      # ESLint (use `npm run lint` to auto-fix)
npm run typecheck    # nuxt typecheck (vue-tsc)
npm run build
```

Also:

- Keep changes focused. One fix or feature per pull request is easiest to review.
- Follow the existing code style and the conventions in [CLAUDE.md](./CLAUDE.md) (for example, Nuxt UI semantic colors instead of raw Tailwind colors).
- If you change the database schema, run `npm run db:generate` and include the generated migration.
- Update the README or `.env.example` when you add or change a feature or environment variable.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Make your changes and run the checks above.
3. Open a pull request against `main` describing what changed and why. Link the related issue if there is one.

## Issues

Found a bug or have an idea? [Open an issue](https://github.com/BeyondFolder/nuxt-beyond/issues). For bugs, include steps to reproduce, what you expected, and what happened. Please do not post secrets or real API keys in issues.

Browse open work in [issues](https://github.com/BeyondFolder/nuxt-beyond/issues) and [pull requests](https://github.com/BeyondFolder/nuxt-beyond/pulls).

## Be kind

Be respectful and constructive in issues, reviews, and discussions. Assume good intent, and help keep this a welcoming place for everyone.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
