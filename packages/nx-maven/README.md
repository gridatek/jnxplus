# @jnxplus/nx-maven

[![npm version](https://badge.fury.io/js/@jnxplus%2Fnx-maven.svg)](https://badge.fury.io/js/@jnxplus%2Fnx-maven)

This plugin adds Maven multi-module capabilities to Nx workspace.

## Quick Start

Get started with nx-maven in 5 steps:

```bash
# 1. Install the plugin
npm install --save-dev @jnxplus/nx-maven

# 2. Initialize workspace with Maven support (Java 17 + Spring Boot Parent POM)
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

**Additional options:**

- `--mavenRootDirectory` - Subdirectory for Maven files (default: workspace root). See [Maven Root Directory](#important-maven-root-directory) section.
- `--aggregatorProjectGroupId` - GroupId for root aggregator project (default: com.example)
- `--aggregatorProjectName` - Name for root aggregator project (default: root-aggregator-project)
- `--aggregatorProjectVersion` - Version for root aggregator project (default: 0.0.1-SNAPSHOT)
- `--localRepoRelativePath` - Path to Maven local repository where dependencies are stored, relative to mavenRootDirectory (default: .m2/repository). Must be a subfolder within the workspace so Nx can cache and restore dependencies between builds
- `--skipWrapper` - Skip generating Maven wrapper (default: false)
- `--formatter` - Code formatter to use: prettier or none (default: prettier)

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

- ✅ **Monorepo organization** - Keep Maven projects isolated in their own directory
- ✅ **Better Nx caching** - Separating Maven files improves Nx cache calculations and project graph performance

**When to skip `mavenRootDirectory` (use root):**

- ✅ **Simpler structure** - Fewer nested directories
- ✅ **Hybrid workspaces** - Mix Maven projects with other technologies (Node.js, Python, etc.) at the root level

**Note:** Once set during init, the `mavenRootDirectory` should remain consistent for all Maven projects in the workspace.

### 3. Plugin configuration

The init command configures the plugin in your `nx.json` file. You can customize these options to fit your workspace needs.

**Example configuration with default values:**

```json
{
  "plugins": [
    {
      "plugin": "@jnxplus/nx-maven",
      "options": {
        "mavenRootDirectory": "nx-maven",
        "localRepoRelativePath": ".m2/repository",
        "buildTargetName": "build",
        "testTargetName": "test",
        "serveTargetName": "serve",
        "integrationTestTargetName": "integration-test",
        "buildImageTargetName": "build-image",
        "skipAggregatorProjectLinking": false,
        "skipProjectWithoutProjectJson": false
      }
    }
  ]
}
```

**Available options:**

- `mavenRootDirectory` - Subdirectory for Maven files (default: workspace root)
- `localRepoRelativePath` - Path to Maven local repository (default: .m2/repository)
- `buildTargetName` - Name for the build target (default: build)
- `testTargetName` - Name for the test target (default: test)
- `serveTargetName` - Name for the serve target (default: serve)
- `integrationTestTargetName` - Name for the integration test target (default: integration-test)
- `buildImageTargetName` - Name for the build image target (default: build-image)
- `skipAggregatorProjectLinking` - Skip linking aggregator projects in the dependency graph. Enable this when aggregator projects only contain `<modules>` declarations and all configuration is handled by parent projects. This improves Nx graph performance by reducing unnecessary dependency links. See [Understanding parent projects vs aggregator projects](#8-understanding-parent-projects-vs-aggregator-projects) for more details (default: false)
- `skipProjectWithoutProjectJson` - Skip projects that don't have a project.json file (default: false)

### 4. Generate a parent project (optional)

Parent projects help organize your applications and libraries with shared dependency management. Use parent projects when you need custom dependency management, want to organize projects into logical groups, or need to support multiple frameworks in your workspace.

```bash
nx generate @jnxplus/nx-maven:parent-project my-parent-project
```

Key options:

- `--javaVersion` - Java version (17, 21, 25, or none)
- `--dependencyManagement` - Dependency management strategy (same options as init)
- `--language` - Language for sub-projects: java, kotlin, or java-kotlin
- `--parentProject` - Parent project to inherit from (for nested parent projects)
- `--aggregatorProject` - Aggregator project that manages a group of submodules

### 5. Generate applications and libraries

#### Generate an application

```bash
nx generate @jnxplus/nx-maven:application my-app
```

Key options:

- `--framework` - Framework to use: spring-boot, quarkus, micronaut, or none
- `--language` - Language: java or kotlin (default: java)
- `--parentProject` - Parent project to use (uses root aggregator project if not specified)
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
- `--parentProject` - Parent project to use (uses root aggregator project if not specified)
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

### 6. Common tasks

| Action                               | Command                                         |
| ------------------------------------ | ----------------------------------------------- |
| Build a project                      | `nx build my-project`                           |
| Serve an application                 | `nx serve my-app`                               |
| Test a project                       | `nx test my-project`                            |
| Build a Docker image                 | `nx build-image my-app`                         |
| Run custom Maven task                | `nx run-task my-project --task="clean install"` |
| Format a Java project                | `nx format --projects my-project`               |
| Visualize project's dependency graph | `nx graph`                                      |

### 7. Environment variables

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

#### Using a .env file

Create a `.env` file in your workspace root to persist environment variables across sessions:

```bash
# .env file example
NX_MAVEN_CLI=mvnd
NX_MAVEN_CLI_OPTS=--no-transfer-progress --batch-mode
```

**Note:** The `.env` file is automatically loaded by Nx. Variables defined here will be available to all nx-maven commands.

### 8. Understanding parent projects vs aggregator projects

**Why separate them?** In nx-maven, keeping parent projects (configuration) separate from aggregator projects (module lists) improves Nx graph performance. Parent projects stay stable, aggregators only change when adding/removing projects.

#### Parent Project (`--parentProject`)

**What it does:** Child projects inherit configuration and dependency management.

**Contains:**

- Dependency versions (`<dependencyManagement>`)
- Plugin configurations
- Java version and properties
- Framework configurations (Spring Boot, Quarkus, Micronaut)

**Example `pom.xml`:**

```xml
<parent>
  <groupId>com.example</groupId>
  <artifactId>my-parent</artifactId>
  <version>0.0.1-SNAPSHOT</version>
</parent>
```

#### Aggregator Project (`--aggregatorProject`)

**What it does:** Lists submodules for coordinated Maven builds.

**Contains:**

- Only `<modules>` declarations
- No configuration or dependency management (use parent projects for that)

**Example `pom.xml`:**

```xml
<modules>
  <module>my-app</module>
  <module>my-lib</module>
</modules>
```

#### Comparison

| Aspect       | Parent Project             | Aggregator Project              |
| ------------ | -------------------------- | ------------------------------- |
| Purpose      | Configuration inheritance  | Build coordination              |
| Direction    | Bottom-up (child → parent) | Top-down (aggregator → modules) |
| Changes when | Configuration updates      | Projects added/removed          |

#### Patterns

**1. Default (root as parent and aggregator):**

```bash
# Generate applications and libraries directly
# They inherit from root pom.xml and are listed there as modules
nx generate @jnxplus/nx-maven:application my-app --framework spring-boot
nx generate @jnxplus/nx-maven:library my-lib --framework spring-boot
```

All projects inherit configuration from and are aggregated by the root `pom.xml`.

**2. Separate parent and aggregator (recommended for advanced performance):**

```bash
# Create parent for configuration
nx generate @jnxplus/nx-maven:parent-project shared-config --javaVersion 17

# Create aggregator (modules only, no config)
nx generate @jnxplus/nx-maven:parent-project apps-aggregator --javaVersion none --dependencyManagement none

# Projects inherit from parent, listed in aggregator
nx generate @jnxplus/nx-maven:application app1 --parentProject shared-config --aggregatorProject apps-aggregator
```

**Tip:** When using this pattern, enable `skipAggregatorProjectLinking: true` in your `nx.json` plugin options to optimize Nx graph performance since aggregators only contain module lists.

## License

MIT © 2021-2025 Khalil LAGRIDA
