# Contributing to Gitzbook

Thank you for considering contributing to Gitzbook! This document explains our development process and how to get involved.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](https://gitzbook.dev/code-of-conduct). We are committed to providing a welcoming and inclusive experience for everyone.

## How to Contribute

### Reporting Bugs

1. Search [existing issues](https://github.com/gitzbook/gitzbook/issues) to avoid duplicates
2. Use the **Bug Report** issue template
3. Include:
   - Gitzbook version (`gitzbook --version`)
   - Node.js version (`node --version`)
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Config file (if relevant)

### Suggesting Features

1. Open a **Feature Request** issue
2. Describe the problem your feature would solve
3. Propose a solution and consider alternatives
4. Label with `enhancement`

### Submitting Code

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Make your changes
4. Write or update tests
5. Run the test suite:
   ```bash
   npm test
   ```
6. Ensure linting passes:
   ```bash
   npm run lint
   ```
7. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add reading time plugin support"
   ```
8. Push and open a Pull Request

## Development Setup

```bash
# Clone the repo
git clone https://github.com/gitzbook/gitzbook.git
cd gitzbook

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
src/
  cli/          # CLI commands and argument parsing
  core/         # Site building, page resolution, config loading
  markdown/     # Markdown parser and extensions
  plugins/      # Built-in plugins and plugin API
  theme/        # Default theme components and styles
  types/        # TypeScript type definitions
  utils/        # Shared utilities
test/
  unit/         # Unit tests
  integration/  # Integration tests
  fixtures/     # Test fixtures and sample docs
```

## Commit Message Format

We use Conventional Commits:

- `feat:` -- New feature
- `fix:` -- Bug fix
- `docs:` -- Documentation changes
- `refactor:` -- Code refactoring (no feature change)
- `test:` -- Adding or updating tests
- `chore:` -- Maintenance tasks
- `perf:` -- Performance improvements

## Pull Request Guidelines

- Keep PRs focused on a single change
- Update documentation if your change affects user-facing behavior
- Add tests for new functionality
- Ensure all CI checks pass
- Request a review from a maintainer

## Release Process

Releases are managed by maintainers using the following process:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a Git tag: `git tag v2.x.x`
4. Push tag: `git push --tags`
5. CI automatically publishes to npm

## Questions?

- Open a [Discussion](https://github.com/gitzbook/gitzbook/discussions)
- Join our [Discord](https://discord.gg/gitzbook)
- Email: team@gitzbook.dev
