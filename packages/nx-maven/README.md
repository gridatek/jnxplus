# @jnxplus/nx-maven

[![npm version](https://badge.fury.io/js/@jnxplus%2Fnx-maven.svg)](https://badge.fury.io/js/@jnxplus%2Fnx-maven)

This plugin adds Maven multi-module capabilities to Nx workspace.

## Quick Start

Get started with nx-maven in 5 steps:

```bash
# 1. Install the plugin
npm install --save-dev @jnxplus/nx-maven

# 2. Initialize workspace with Maven support (Java 17 + Spring Boot)
nx generate @jnxplus/nx-maven:init --javaVersion 17 --dependencyManagement spring-boot-parent-pom

# 3. Generate a library
nx generate @jnxplus/nx-maven:library my-lib --framework spring-boot

# 4. Generate an application that uses the library
nx generate @jnxplus/nx-maven:application my-app --framework spring-boot --projects my-lib

# 5. Serve the application
nx serve my-app
```

## Supported versions

| @jnxplus/nx-maven | Nx            | Spring Boot | Quarkus | Micronaut |
| ----------------- | ------------- | ----------- | ------- | --------- |
| 1.x.x             | >= 19         | 3.x.x       | 3.x.x   | 4.x.x     |
| 0.x.x             | >= 17 & <= 18 | 3.x.x       | 3.x.x   | 4.x.x     |

## Getting Started

### 0. Prerequisites

`@jnxplus/nx-maven` requires a Java 17 or higher Runtime Environment and the current Long Term Support (LTS) version of node.js.

### 1. Install the plugin

In the Nx workspace root folder, run this command to install the plugin :

```bash
npm install --save-dev @jnxplus/nx-maven
```

### 2. Init workspace with Maven support

The following command adds Maven support (Maven wrapper and config files) to the workspace. This only needs to be performed once per workspace.

```bash
nx generate @jnxplus/nx-maven:init
```

You will be prompted for:

- **Java version** (default: none) - Options: none, 17, 21, or 25
- **Dependency management strategy** (default: none) - Options:
  - `spring-boot-parent-pom` - Spring Boot Parent POM
  - `spring-boot-bom` - Spring Boot BOM (Bill of Materials)
  - `quarkus-bom` - Quarkus BOM
  - `micronaut-parent-pom` - Micronaut Parent POM
  - `micronaut-bom` - Micronaut BOM
  - `none` - Configure manually later in a parent project (for advanced use cases)

#### Important: Maven Root Directory

By default, Maven files (wrapper, config, and projects) are placed at the workspace root. However, you can specify a subdirectory using the `--mavenRootDirectory` option:

```bash
nx generate @jnxplus/nx-maven:init --mavenRootDirectory maven
```

This creates the following structure:

```
workspace-root/
├── maven/                    # Maven root directory
│   ├── .mvn/                # Maven wrapper config
│   ├── mvnw, mvnw.cmd       # Maven wrapper scripts
│   ├── pom.xml              # Root aggregator POM
│   ├── .m2/repository/      # Local Maven repository
│   └── my-app/              # Your projects
│       └── pom.xml
├── apps/                    # Other Nx apps (non-Maven)
├── libs/                    # Other Nx libs (non-Maven)
└── package.json
```

**When to use `mavenRootDirectory`:**

- ✅ **Hybrid workspaces** - Mix Maven projects with other technologies (Node.js, Python, etc.)
- ✅ **Monorepo organization** - Keep Maven projects isolated in their own directory
- ✅ **Multiple build tools** - Use both Maven and Gradle in the same workspace

**When to skip `mavenRootDirectory` (use root):**

- ✅ **Maven-only workspace** - All projects use Maven
- ✅ **Simpler structure** - Fewer nested directories
- ✅ **Default Maven conventions** - Maven users expect files at the root

**Note:** Once set during init, the `mavenRootDirectory` should remain consistent for all Maven projects in the workspace.

### 3. Generate a parent project (optional)

Parent projects help organize your applications and libraries with shared dependency management.

```bash
nx generate @jnxplus/nx-maven:parent-project my-parent-project
```

Key options:

- `--javaVersion` - Java version (17, 21, 25, or none)
- `--dependencyManagement` - Dependency management strategy (same options as init)
- `--language` - Language for sub-projects: java, kotlin, or java-kotlin
- `--parentProject` - Parent project to inherit from (for nested parent projects)
- `--aggregatorProject` - Aggregator project that manages a group of submodules

### 4. Generate applications and libraries

#### Generate an application

```bash
nx generate @jnxplus/nx-maven:application my-app
```

Key options:

- `--framework` - Framework to use: spring-boot, quarkus, micronaut, or none
- `--language` - Language: java or kotlin (default: java)
- `--parentProject` - Parent project to use (required)
- `--port` - Server port for the application
- `--packaging` - Packaging type: jar or war (default: jar)
- `--minimal` - Generate minimal application without starter code
- `--groupId` - Maven groupId (default: com.example)
- `--projectVersion` - Maven version (default: 0.0.1-SNAPSHOT)
- `--directory` - Subdirectory where the project will be created (e.g., `apps/backend` creates the project in that path)
- `--simpleName` - Don't include the directory in the project name (default: true)
- `--simplePackageName` - Don't include the directory in the package name (default: true)
- `--tags` - Tags for the project (comma-separated)

#### Generate a library

```bash
nx generate @jnxplus/nx-maven:library my-lib
```

Key options:

- `--framework` - Framework to use: spring-boot, quarkus, micronaut, or none
- `--language` - Language: java or kotlin (default: java)
- `--parentProject` - Parent project to use (required)
- `--projects` - Projects that will use this library (comma-separated)
- `--skipStarterCode` - Skip generating starter code
- `--groupId` - Maven groupId (default: com.example)
- `--projectVersion` - Maven version (default: 0.0.1-SNAPSHOT)
- `--directory` - Subdirectory where the project will be created (e.g., `libs/shared` creates the project in that path)
- `--simpleName` - Don't include the directory in the project name (default: true)
- `--simplePackageName` - Don't include the directory in the package name (default: true)
- `--tags` - Tags for the project (comma-separated)

**Example with directory:**

```bash
# Creates project at: libs/backend/my-lib
# Project name (with simpleName=true): my-lib
# Package name (with simplePackageName=true): com.example.mylib
nx generate @jnxplus/nx-maven:library my-lib --directory backend

# Creates project at: libs/backend/my-lib
# Project name (with simpleName=false): backend-my-lib
# Package name (with simplePackageName=false): com.example.backend.mylib
nx generate @jnxplus/nx-maven:library my-lib --directory backend --simpleName false --simplePackageName false
```

### 5. Common tasks

| Action                               | Command                                         |
| ------------------------------------ | ----------------------------------------------- |
| Build a project                      | `nx build my-project`                           |
| Serve an application                 | `nx serve my-app`                               |
| Test a project                       | `nx test my-project`                            |
| Build a Docker image                 | `nx build-image my-app`                         |
| Run custom Maven task                | `nx run-task my-project --task="clean install"` |
| Format a Java project                | `nx format --projects my-project`               |
| Visualize project's dependency graph | `nx graph`                                      |

### 6. Environment variables

You can customize nx-maven behavior using environment variables:

#### NX_MAVEN_CLI

Controls which Maven executable to use. Accepts: `mvnw`, `mvn`, or `mvnd`.

**Examples:**

```bash
# Linux/macOS
export NX_MAVEN_CLI=mvn
nx build my-app

# Windows (PowerShell)
$env:NX_MAVEN_CLI='mvnd'
nx build my-app

# Windows (CMD)
set NX_MAVEN_CLI=mvn
nx build my-app
```

**Default behavior (when not set):**

- Uses `mvnw` (Maven wrapper) if it exists in the workspace
- Falls back to `mvn` if wrapper doesn't exist

#### NX_MAVEN_CLI_OPTS

Pass additional arguments to Maven commands globally. Useful for CI/CD environments or consistent build settings.

**Examples:**

```bash
# Linux/macOS - disable transfer progress and enable verbose plugin validation
export NX_MAVEN_CLI_OPTS='--no-transfer-progress -Dmaven.plugin.validation=VERBOSE'
nx build my-app

# Windows (PowerShell) - run in batch mode
$env:NX_MAVEN_CLI_OPTS='--batch-mode'
nx test my-app

# Windows (CMD) - use offline mode
set NX_MAVEN_CLI_OPTS=--offline
nx build my-app
```

**Common options:**

- `--no-transfer-progress` - Disable download progress output (useful in CI)
- `--batch-mode` - Run in non-interactive mode
- `--offline` - Work offline (use cached dependencies only)
- `-Dmaven.plugin.validation=VERBOSE` - Enable verbose plugin validation

### 7. Understanding parent projects vs aggregator projects

In Maven, there are two important concepts that serve different purposes. **Note:** The patterns described here are recommendations to help you get started, but you can configure your projects however best suits your needs.

#### Parent Project (`--parentProject`)

A **parent project** defines shared configuration and dependency management that child projects inherit from. It's used for:

- Sharing dependency versions across projects
- Defining common plugin configurations
- Setting Java version and other properties
- Inheriting framework configurations (Spring Boot, Quarkus, Micronaut)

When you specify `--parentProject my-parent` when generating an app or library, the generated `pom.xml` will have:

```xml
<parent>
  <groupId>com.example</groupId>
  <artifactId>my-parent</artifactId>
  <version>0.0.1-SNAPSHOT</version>
</parent>
```

Child projects **inherit** configuration from their parent project.

#### Aggregator Project (`--aggregatorProject`)

An **aggregator project** is a Maven project that contains submodules for build coordination. It's used for:

- Building multiple submodules together as a group
- Managing the build order based on dependencies between submodules
- Organizing projects into logical groups

When you specify `--aggregatorProject my-aggregator` when generating a project, that project will be added as a `<module>` (submodule) to the aggregator's `pom.xml`:

```xml
<modules>
  <module>my-app</module>
  <module>my-lib</module>
</modules>
```

The aggregator project **coordinates builds** of its submodules but doesn't necessarily provide inheritance.

#### Key differences

| Aspect          | Parent Project                                   | Aggregator Project                               |
| --------------- | ------------------------------------------------ | ------------------------------------------------ |
| Purpose         | Share configuration and dependencies             | Coordinate multi-module builds                   |
| Relationship    | Inheritance (child inherits from parent)         | Composition (aggregator contains submodules)     |
| Direction       | Bottom-up (child references parent)              | Top-down (aggregator lists submodules)           |
| Can be combined | Yes, a project can be both parent and aggregator | Yes, a project can be both parent and aggregator |

#### Common patterns (recommended, but not required)

1. **Parent without aggregator**: Child projects inherit configuration but are not built together

   ```bash
   nx generate @jnxplus/nx-maven:parent-project shared-config --javaVersion 17
   nx generate @jnxplus/nx-maven:application app1 --parentProject shared-config
   nx generate @jnxplus/nx-maven:application app2 --parentProject shared-config
   ```

2. **Parent with aggregator** (most common): Projects inherit configuration AND are built together

   ```bash
   nx generate @jnxplus/nx-maven:parent-project shared-parent --javaVersion 17
   nx generate @jnxplus/nx-maven:application app1 --parentProject shared-parent --aggregatorProject shared-parent
   nx generate @jnxplus/nx-maven:library lib1 --parentProject shared-parent --aggregatorProject shared-parent
   ```

3. **Separate parent and aggregator**: Use different projects for inheritance vs build coordination

   ```bash
   # Parent for configuration
   nx generate @jnxplus/nx-maven:parent-project shared-config --javaVersion 17

   # Aggregator for apps (without dependency management)
   nx generate @jnxplus/nx-maven:parent-project apps-aggregator --javaVersion none --dependencyManagement none

   # Apps inherit from shared-config but are aggregated by apps-aggregator
   nx generate @jnxplus/nx-maven:application app1 --parentProject shared-config --aggregatorProject apps-aggregator
   ```

### 8. Typical workflows

#### For beginners (recommended)

1. Initialize workspace and select your preferred Java version and dependency management:

   ```bash
   nx generate @jnxplus/nx-maven:init
   ```

   **Important:** When prompted, select a concrete Java version (17, 21, or 25) and a dependency management strategy (Spring Boot Parent POM, Quarkus BOM, etc.) rather than "none". The "none" option is for advanced users only.

2. Generate a parent project (optional, for organizing projects):

   ```bash
   nx generate @jnxplus/nx-maven:parent-project shared-parent
   ```

3. Generate applications and libraries:
   ```bash
   nx generate @jnxplus/nx-maven:application my-app --framework spring-boot --parentProject shared-parent
   nx generate @jnxplus/nx-maven:library my-lib --framework spring-boot --parentProject shared-parent
   ```

#### For advanced users

1. Initialize workspace without defaults:

   ```bash
   nx generate @jnxplus/nx-maven:init --javaVersion none --dependencyManagement none
   ```

2. Create a common parent project for Java version:

   ```bash
   nx generate @jnxplus/nx-maven:parent-project common-parent --javaVersion 21 --dependencyManagement none
   ```

3. Create framework-specific parent projects that inherit from the common parent:

   ```bash
   nx generate @jnxplus/nx-maven:parent-project spring-parent --javaVersion none --dependencyManagement spring-boot-bom --parentProject common-parent
   nx generate @jnxplus/nx-maven:parent-project quarkus-parent --javaVersion none --dependencyManagement quarkus-bom --parentProject common-parent
   ```

4. Generate projects using framework-specific parent projects:
   ```bash
   nx generate @jnxplus/nx-maven:application spring-app --framework spring-boot --parentProject spring-parent
   nx generate @jnxplus/nx-maven:application quarkus-app --framework quarkus --parentProject quarkus-parent
   ```

## License

MIT © 2021-2025 Khalil LAGRIDA
