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
├── maven/                   # Maven root directory
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

### 3. Generate a parent project (optional)

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

### 4. Generate applications and libraries

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

### 6. Executors

nx-maven primarily uses the `run-task` executor for all Maven operations. Most targets (build, test, serve, etc.) internally use `run-task` to execute Maven commands.

#### run-task

Execute arbitrary Maven tasks on a project:

```bash
nx run-task my-project --task="clean install"
```

**Options:**

- `--task` (required) - Maven task(s) to execute. Can be a string or array of strings
- `--outputDirLocalRepo` - Sub-directory in Maven local repository where artifacts from install phase will be placed
- `--skipProject` - Skip specifying the project with `-pl :project` flag
- `--cwd` - Working directory for the command. Can be relative (to Maven root) or absolute
- `--skipExecutor` - Skip executor execution (useful for conditional runs)

**Examples:**

```bash
# Single task
nx run-task my-app --task="clean package"

# Multiple tasks
nx run-task my-app --task="clean" --task="test" --task="package"

# With custom working directory
nx run-task my-app --task="compile" --cwd="custom-path"

# Skip project specification (run from Maven root)
nx run-task my-app --task="dependency:tree" --skipProject
```

#### quarkus-build-image

Build a Docker image for Quarkus applications:

```bash
nx build-image my-quarkus-app
```

**Options:**

- `--imageType` - Image type to build (default: jvm). Options: jvm, native, etc.
- `--imageNamePrefix` - Image name prefix (default: quarkus)
- `--imageNameSuffix` - Image name suffix

**Examples:**

```bash
# Build JVM image (default)
nx build-image my-quarkus-app

# Build native image
nx build-image my-quarkus-app --imageType=native

# Custom image name
nx build-image my-quarkus-app --imageNamePrefix=myapp --imageNameSuffix=latest
```

**Note:** For Spring Boot and Micronaut applications, the build-image target uses the `run-task` executor with framework-specific commands:

- Spring Boot: `spring-boot:build-image`
- Micronaut: `package -Dpackaging=docker`

### 7. Plugin configuration

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
- `skipAggregatorProjectLinking` - Skip linking aggregator projects in the dependency graph. Enable this when aggregator projects only contain `<modules>` declarations and all configuration is handled by parent projects. This improves Nx graph performance by reducing unnecessary dependency links. See [Understanding parent projects vs aggregator projects](#10-understanding-parent-projects-vs-aggregator-projects) for more details (default: false)
- `skipProjectWithoutProjectJson` - Skip projects that don't have a project.json file (default: false)

### 8. Environment variables

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

### 9. Visualizing the project graph

Nx provides a powerful project graph visualization to understand dependencies between your Maven projects:

```bash
nx graph
```

This opens an interactive view showing:

- **Project dependencies** - How your applications and libraries depend on each other
- **Build order** - Understanding which projects need to be built first
- **Impact analysis** - See what projects are affected by changes

**Useful graph commands:**

```bash
# View the full project graph
nx graph

# Show what's affected by changes
nx graph --affected

# Focus on a specific project and its dependencies
nx graph --focus=my-app

# Show only projects that depend on a specific project
nx graph --exclude=*,!tag:my-tag
```

**How nx-maven builds the graph:**

- **Maven dependencies** - Extracted from `pom.xml` files (`<dependencies>` sections)
- **Profile dependencies** - Dependencies defined within Maven profiles (`<profiles>` → `<dependencies>`)
- **Plugin dependencies** - Dependencies used by Maven plugins (`<build>` → `<plugins>` → `<dependencies>`). Note: Plugin dependencies can sometimes create cyclic dependency issues in the graph
- **Parent projects** - Child projects depend on their parent (`<parent>` section)
- **Aggregator projects** - Optional linking based on `<modules>` (controlled by `skipAggregatorProjectLinking`)

**Limitations:**

- Profile dependencies are always included in the graph, regardless of whether the profile is active. This ensures the dependency graph remains consistent but may show dependencies that aren't used in your current build configuration.

**Skipping projects:**

You can exclude certain projects from the graph by setting `skipProjectWithoutProjectJson: true` in your plugin configuration. This will skip any Maven projects that don't have a `project.json` file, which is useful for ignoring Maven modules that aren't managed by Nx.

This integration allows Nx to:

- Run only affected tests when you make changes
- Build projects in the correct order
- Cache and distribute builds efficiently

### 10. Understanding parent projects vs aggregator projects

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

### 11. Project tagging

All projects generated by nx-maven are automatically tagged with `nx-maven`. This allows you to:

**Target Maven projects specifically:**

```bash
# Run tests only on Maven projects
nx run-many -t test --projects=tag:nx-maven

# Build all Maven projects
nx run-many -t build --projects=tag:nx-maven

# Lint only Maven projects
nx run-many -t lint --projects=tag:nx-maven
```

**Filter in the project graph:**

```bash
# Show only Maven projects in the graph
nx graph --projects=tag:nx-maven
```

**Custom tags:**

You can add additional tags when generating projects using the `--tags` option:

```bash
# Add custom tags
nx generate @jnxplus/nx-maven:application my-app --tags=backend,api

# Projects will have both auto and custom tags: ['nx-maven', 'backend', 'api']
```

### 12. Version management

nx-maven handles both static and property-based versions from `pom.xml` files.

#### Static versions

```xml
<version>0.0.1-SNAPSHOT</version>
```

Static versions are used directly for dependency resolution and project graph construction.

#### Property-based versions

nx-maven supports Maven's [CI-friendly versions](https://maven.apache.org/guides/mini/guide-maven-ci-friendly.html) using properties like `${revision}`, `${sha1}`, or `${changelist}`:

```xml
<version>${revision}</version>

<properties>
  <revision>1.0.0-SNAPSHOT</revision>
</properties>
```

**Version resolution process:**

When nx-maven encounters a property-based version, it resolves it in this order:

1. **Project properties** - Check `<properties>` in the current project's `pom.xml`
2. **Parent properties** - Recursively check parent project properties
3. **Maven evaluation** - As a fallback, use `mvn help:evaluate` (with performance warning)

**Example with CI-friendly versions:**

```xml
<!-- Parent pom.xml -->
<groupId>com.example</groupId>
<artifactId>parent</artifactId>
<version>${revision}</version>

<properties>
  <revision>1.0.0-SNAPSHOT</revision>
</properties>

<!-- Child pom.xml -->
<parent>
  <groupId>com.example</groupId>
  <artifactId>parent</artifactId>
  <version>${revision}</version>
</parent>
<!-- Child inherits revision property from parent -->
```

**Limitations:**

- nx-maven resolves versions statically when building the project graph, not at runtime. If you override versions at build time (e.g., `mvn clean install -Drevision=1.2.3`), the graph will still use the version defined in `<properties>`.

**Note:** If nx-maven cannot resolve a version using properties (e.g., `${project.parent.version}`), it will fall back to `mvn help:evaluate`, which is slower. If you encounter performance issues, please [open an issue](https://github.com/khalilou88/jnxplus/issues).

### 13. Other generators

#### Preset

The preset generator is used when creating a new Nx workspace with Maven support from scratch:

```bash
npx create-nx-workspace@latest my-workspace --preset=@jnxplus/nx-maven
```

This combines workspace creation and Maven initialization in one step.

#### Wrapper

Update or add the Maven wrapper to your workspace:

```bash
nx generate @jnxplus/nx-maven:wrapper
```

**Options:**

- `--skipGitignore` - Don't add Maven Wrapper to .gitignore (default: false)
- `--skipFormat` - Skip formatting files (default: false)

Use this generator to:

- Update to the latest Maven wrapper version
- Add the wrapper if it was skipped during init (`--skipWrapper`)
- Restore the wrapper if it was accidentally deleted

## License

MIT © 2021-2025 Khalil LAGRIDA
