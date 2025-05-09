# Contributing to SHEYOU Virtual Space

We love your input! We want to make contributing to SHEYOU Virtual Space as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Code Style

We use several tools to maintain code quality:

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Husky for Git hooks
- lint-staged for pre-commit checks

Please ensure your code:

- Passes TypeScript compilation (`npm run typecheck`)
- Passes ESLint checks (`npm run lint`)
- Is formatted with Prettier (`npm run format`)
- Includes appropriate tests
- Has meaningful commit messages

## Project Structure

Follow the established project structure:

- Place components in appropriate subdirectories under `src/components/`
- Add services in `src/services/`
- Include types in `src/types/`
- Add utilities in `src/utils/`

## Environment Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Fill in required values

3. Enable Git hooks:
   ```bash
   npm run prepare
   ```

## Testing

- Write tests for new features
- Update tests for modified code
- Run tests before submitting PR:
  ```bash
  npm test
  ```

## Documentation

- Update README.md for significant changes
- Document new features and APIs
- Include JSDoc comments for functions
- Update STRUCTURE_PLAN.md for architectural changes

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the STRUCTURE_PLAN.md if you change the architecture
3. Update the package.json if you add dependencies
4. The PR will be merged once you have the sign-off of maintainers

## Any Questions?

Feel free to contact the project maintainers if you have any questions.
