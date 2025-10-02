# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JNxPlus is a monorepo containing Nx plugins that add Java/Kotlin build tool support (Maven and Gradle) to Nx workspaces. The project enables developers to use popular Java frameworks (Spring Boot, Quarkus, Micronaut) within Nx monorepos.

## Key Packages

**Published packages** (in release configuration in nx.json):
- `@jnxplus/nx-maven` - Nx plugin for Maven multi-module projects
- `@jnxplus/nx-gradle` - Nx plugin for Gradle multi-project builds
- `@jnxplus/common` - Shared utilities and types used by both plugins
- `@jnxplus/xml` - XML parsing utilities for Maven pom.xml files
- `create-nx-maven-workspace` - CLI to create Nx workspace with Maven support
- `create-nx-gradle-workspace` - CLI to create Nx workspace with Gradle support

**Internal packages** (not published):
- `packages/internal/executors` - Shared executor implementations
- `packages/internal/generators-files` - Template files for generators
- `packages/internal/maven-wrapper` - Maven wrapper utilities
- `packages/internal/testing` - Testing utilities
- `packages/gradle-plugin` - Gradle plugin (Groovy) that provides project dependency information

## Architecture

### Plugin System
Both nx-maven and nx-gradle follow the same architectural pattern:

1. **Graph Integration** (`src/graph/`):
   - `create-nodes.ts` / `create-nodes-v2.ts` - Infer Nx projects from build tool configuration
   - `create-dependencies.ts` - Infer project dependencies from build tool
   - `graph-utils.ts` - Helper functions for graph creation
   - For Gradle: executes `:projectDependencyTask` (from gradle-plugin) to get project structure
   - For Maven: parses pom.xml files to extract project information

2. **Generators** (`src/generators/`):
   - `init` - Initialize workspace with build tool support (wrappers and config)
   - `application` - Generate new application projects
   - `library` - Generate new library projects
   - `parent-project` (Maven only) - Generate Maven parent projects
   - `preset` - Preset for workspace initialization
   - `wrapper` - Add/update build tool wrapper

3. **Executors** (`src/executors/`):
   - `run-task` - Execute arbitrary Maven/Gradle tasks

### Path Aliases
TypeScript path aliases are configured in `tsconfig.base.json`:
- `@jnxplus/common` → `packages/common/src/index.ts`
- `@jnxplus/nx-gradle` → `packages/nx-gradle/src/index.ts`
- `@jnxplus/nx-maven` → `packages/nx-maven/src/index.ts`
- `@jnxplus/xml` → `packages/xml/src/index.ts`
- `@jnxplus/internal-executors` → `packages/internal/executors/src/index.ts`
- `@jnxplus/internal/testing` → `packages/internal/testing/src/index.ts`

## Common Commands

### Build and Test
```bash
# Build all packages
nx run-many -t build

# Build a specific package
nx build nx-maven
nx build nx-gradle

# Run tests for a specific package
nx test nx-maven

# Run all tests
nx run-many -t test

# Lint
nx run-many -t lint
```

### Development Workflow

#### Local Testing
```bash
# Start local npm registry (Verdaccio)
nx local-registry

# Publish packages to local registry for testing
nx run-many --targets publish --ver 0.0.0-e2e --tag e2e

# Reset to public registry
npm config set registry https://registry.npmjs.org/
```

#### Release Process
```bash
# Dry run release (minor version)
nx release --specifier minor --skip-publish --dry-run

# Dry run release (prerelease)
nx release --specifier prerelease --skip-publish --dry-run

# Version and publish with next tag
nx release version --specifier preminor --preid next --dry-run
nx run-many -t build
nx release publish --tag next --verbose --dry-run
```

### Git Hooks
- Pre-commit: Runs `lint-staged` which executes ESLint and Prettier on staged files
- Commit messages follow Angular convention (enforced by commitlint)

## Requirements
- Java 17 or higher Runtime Environment
- Node.js LTS version
- For Gradle projects: Gradle wrapper is generated and used
- For Maven projects: Maven wrapper is generated and used

## Framework Support
All plugins support:
- Spring Boot 3.x.x
- Quarkus 3.x.x
- Micronaut 4.x.x

## Workspace Configuration
- Nx version: 21.x
- Libraries are in `packages/` directory
- Test/example projects go in `testing-projects/` directory
- Monorepo uses fixed versioning (all packages released together)
- Parallel execution is set to 1 in nx.json
