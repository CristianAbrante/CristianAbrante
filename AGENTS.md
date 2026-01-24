# AGENTS.md - Coding Agent Guidelines

This file provides instructions for AI coding agents working in this repository.

## Repository Overview

GitHub profile repository for CristianAbrante. This is currently a documentation-only repository.

## Build Commands

> Note: No build system is currently configured. When adding code, update this section.

### Example commands for future setup:

```bash
# Install dependencies (Node.js/npm)
npm install

# Install dependencies (Python)
pip install -r requirements.txt

# Build project
npm run build

# Development mode
npm run dev
```

## Test Commands

> Note: No test framework is currently configured. When adding tests, update this section.

### Example commands for future setup:

```bash
# Run all tests
npm test

# Run a single test file
npm test path/to/test-file.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Python testing (pytest):

```bash
# Run all tests
pytest

# Run a single test file
pytest tests/test_example.py

# Run a specific test function
pytest tests/test_example.py::test_function_name

# Run with coverage
pytest --cov=src tests/
```

## Lint and Format Commands

> Note: No linting/formatting tools are currently configured. When adding them, update this section.

### Example commands for future setup:

```bash
# ESLint - Check for issues
npm run lint

# ESLint - Auto-fix issues
npm run lint:fix

# Prettier - Check formatting
npm run format:check

# Prettier - Auto-format
npm run format:write
```

## Code Style Guidelines

### General Principles

- Write clear, readable code with meaningful names
- Prefer composition over inheritance
- Keep functions small and focused on a single responsibility
- Write self-documenting code; use comments only when necessary
- Follow DRY (Don't Repeat Yourself) principle

### Imports

- Group imports in the following order:
  1. External/third-party libraries
  2. Internal modules (absolute imports)
  3. Relative imports from parent directories
  4. Relative imports from current directory
- Use absolute imports when possible
- Sort imports alphabetically within each group

Example (TypeScript):
```typescript
// External libraries
import React from 'react';
import { useState } from 'react';

// Internal modules
import { ApiClient } from '@/lib/api';
import { logger } from '@/utils/logger';

// Relative imports
import { Button } from '../components/Button';
import { useAuth } from './hooks/useAuth';
```

### Formatting

- Use 2 spaces for indentation (TypeScript/JavaScript)
- Use 4 spaces for indentation (Python)
- Maximum line length: 100 characters
- Use single quotes for strings (unless template literals)
- Add trailing commas in multi-line objects/arrays
- Use semicolons (TypeScript/JavaScript)

### Types (TypeScript)

- Always use TypeScript strict mode
- Explicitly type function parameters and return values
- Avoid using `any` type; use `unknown` if type is truly unknown
- Use interfaces for object shapes, types for unions/intersections
- Prefer `type` for simple type aliases

Example:
```typescript
// Good
function processData(data: UserData[]): ProcessedResult {
  // implementation
}

// Avoid
function processData(data: any): any {
  // implementation
}
```

### Naming Conventions

- **Variables/Functions**: camelCase (`getUserData`, `isActive`)
- **Classes/Interfaces**: PascalCase (`UserService`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_URL`)
- **Private properties**: prefix with underscore (`_privateMethod`)
- **Boolean variables**: use is/has/can prefix (`isLoading`, `hasError`)
- **Files**: kebab-case for components/modules (`user-service.ts`, `api-client.ts`)

### Error Handling

- Always handle errors explicitly
- Use try-catch for asynchronous operations
- Provide meaningful error messages
- Log errors appropriately (don't swallow them)
- Create custom error classes for domain-specific errors

Example:
```typescript
// Good
async function fetchUserData(userId: string): Promise<User> {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user ${userId}:`, error);
    throw new UserFetchError(`Unable to retrieve user data for ${userId}`);
  }
}

// Avoid
async function fetchUserData(userId: string) {
  try {
    return await api.get(`/users/${userId}`);
  } catch (error) {
    // Silent failure - bad!
  }
}
```

### Comments and Documentation

- Write JSDoc/docstrings for public APIs and complex functions
- Use inline comments sparingly - only when code intent is unclear
- Keep comments up-to-date with code changes
- Avoid obvious comments that restate the code

Example:
```typescript
/**
 * Calculates the average of an array of numbers.
 * Returns 0 for empty arrays.
 * 
 * @param numbers - Array of numbers to average
 * @returns The arithmetic mean of the input numbers
 */
function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}
```

## Git Workflow

- Write clear, descriptive commit messages
- Use conventional commits format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Keep commits atomic and focused
- Always run tests before committing

Example commit messages:
```
feat(api): add user authentication endpoint
fix(parser): handle edge case with empty input
docs(readme): update installation instructions
```

## Best Practices

1. **Testing**: Write tests for new features and bug fixes
2. **Security**: Never commit secrets, API keys, or credentials
3. **Dependencies**: Keep dependencies up-to-date
4. **Code Review**: All changes should be reviewed before merging
5. **Documentation**: Update documentation when changing behavior

## Additional Resources

- Repository: https://github.com/CristianAbrante/CristianAbrante
- Personal Website: https://cristianabrante.com/
- LinkedIn: https://www.linkedin.com/in/cristianabrante/
