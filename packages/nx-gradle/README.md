# @jnxplus/nx-gradle

[![npm version](https://badge.fury.io/js/@jnxplus%2Fnx-gradle.svg)](https://badge.fury.io/js/@jnxplus%2Fnx-gradle)

This plugin adds Gradle multi-project build capabilities to Nx workspace.

## Quick Start

Get started with nx-gradle in 5 steps:

```bash
# 1. Install the plugin
npm install --save-dev @jnxplus/nx-gradle

# 2. Initialize workspace with Gradle support (Java 17 + Spring Boot)
nx generate @jnxplus/nx-gradle:init --javaVersion 17 --preset spring-boot

# 3. Generate a library
nx generate @jnxplus/nx-gradle:library my-lib --framework spring-boot --directory libs

# 4. Generate an application that uses the library
nx generate @jnxplus/nx-gradle:application my-app --framework spring-boot --projects my-lib --directory apps

# 5. Serve the application
nx serve my-app
```

## Supported versions

| @jnxplus/nx-gradle | Nx            | Spring Boot | Quarkus | Micronaut |
| ------------------ | ------------- | ----------- | ------- | --------- |
| 1.x.x              | >= 19         | 3.x.x       | 3.x.x   | 4.x.x     |
| 0.x.x              | >= 17 & <= 18 | 3.x.x       | 3.x.x   | 4.x.x     |

## Getting Started

### 0. Prerequisites

`@jnxplus/nx-gradle` requires a Java 17 or higher Runtime Environment and the current Long Term Support (LTS) version of node.js.

### 1. Install the plugin

In the Nx workspace root folder, run this command to install the plugin:

```bash
npm install --save-dev @jnxplus/nx-gradle
```

### 2. Init workspace with Gradle support

The following command adds Gradle support (Gradle wrapper and config files) to the workspace. This only needs to be performed once per workspace.

```bash
nx generate @jnxplus/nx-gradle:init
```

You will be prompted for:

- **Java version** (default: 17) - Options: 17, 21, or 25
- **Build DSL** (default: groovy) - Options:
  - `groovy` - Groovy build DSL (build.gradle files)
  - `kotlin` - Kotlin build DSL (build.gradle.kts files)
- **Preset** (default: spring-boot) - Options:
  - `spring-boot` - Spring Boot framework
  - `quarkus` - Quarkus framework
  - `micronaut` - Micronaut framework
  - `none` - No framework (plain Java/Kotlin projects)
- **Version management** (default: version-catalog) - Options:
  - `version-catalog` - Gradle version catalog (gradle/libs.versions.toml)
  - `properties` - Properties file (gradle.properties)

**Additional options:**

- `--gradleRootDirectory` - Subdirectory for Gradle files (default: workspace root). See [Gradle Root Directory](#important-gradle-root-directory) section.
- `--rootProjectName` - Name for root project (default: root-project)
- `--skipWrapper` - Skip generating Gradle wrapper (default: false)
- `--formatter` - Code formatter to use: prettier or none (default: prettier)

#### Important: Gradle Root Directory

By default, Gradle files (wrapper, config, and projects) are placed at the workspace root. However, you can specify a subdirectory using the `--gradleRootDirectory` option:

```bash
nx generate @jnxplus/nx-gradle:init --gradleRootDirectory gradle
```

This creates the following structure:

```
workspace-root/
├── gradle/                  # Gradle root directory
│   ├── gradle/              # Gradle wrapper config & version catalog
│   │   ├── wrapper/
│   │   └── libs.versions.toml
│   ├── gradlew, gradlew.bat # Gradle wrapper scripts
│   ├── settings.gradle      # Settings file
│   ├── build.gradle         # Root build file
│   └── my-app/              # Your projects
│       └── build.gradle
├── apps/                    # Other Nx apps (non-Gradle)
├── libs/                    # Other Nx libs (non-Gradle)
└── package.json
```

**When to use `gradleRootDirectory`:**

- ✅ **Monorepo organization** - Keep Gradle projects isolated in their own directory
- ✅ **Better Nx caching** - Separating Gradle files improves Nx cache calculations and project graph performance

**When to skip `gradleRootDirectory` (use root):**

- ✅ **Simpler structure** - Fewer nested directories
- ✅ **Hybrid workspaces** - Mix Gradle projects with other technologies (Node.js, Python, etc.) at the root level

**Note:** Once set during init, the `gradleRootDirectory` should remain consistent for all Gradle projects in the workspace.

### 3. Generate applications and libraries

#### Generate an application

```bash
nx generate @jnxplus/nx-gradle:application my-app
```

Key options:

- `--framework` - Framework to use: spring-boot, quarkus, micronaut, or none
- `--language` - Language: java or kotlin (default: java)
- `--port` - Server port for the application (default: 8080)
- `--packaging` - Packaging type: jar or war (default: jar)
- `--configFormat` - Configuration format: .properties or .yml (default: .properties)
- `--minimal` - Generate minimal application without starter code
- `--groupId` - Gradle groupId (default: com.example)
- `--projectVersion` - Project version (default: 0.0.1-SNAPSHOT)
- `--directory` - Directory where the project will be created (e.g., `backend` creates at `backend/my-app`, `apps/backend` creates at `apps/backend/my-app`)
- `--simpleName` - Don't include the directory in the project name (default: true)
- `--simplePackageName` - Don't include the directory in the package name (default: true)
- `--tags` - Tags for the project (comma-separated)

#### Generate a library

```bash
nx generate @jnxplus/nx-gradle:library my-lib
```

Key options:

- `--framework` - Framework to use: spring-boot, quarkus, micronaut, or none
- `--language` - Language: java or kotlin (default: java)
- `--projects` - Projects that will use this library (comma-separated)
- `--skipStarterCode` - Skip generating starter code
- `--groupId` - Gradle groupId (default: com.example)
- `--projectVersion` - Project version (default: 0.0.1-SNAPSHOT)
- `--directory` - Directory where the project will be created (e.g., `backend` creates at `backend/my-lib`, `libs/backend` creates at `libs/backend/my-lib`)
- `--simpleName` - Don't include the directory in the project name (default: true)
- `--simplePackageName` - Don't include the directory in the package name (default: true)
- `--tags` - Tags for the project (comma-separated)

**Example with directory:**

```bash
# Creates project at: backend/my-lib
# Project name (with simpleName=true): my-lib
# Package name (with simplePackageName=true): com.example.mylib
nx generate @jnxplus/nx-gradle:library my-lib --directory backend

# Creates project at: backend/my-lib
# Project name (with simpleName=false): backend-my-lib
# Package name (with simplePackageName=false): com.example.backend.mylib
nx generate @jnxplus/nx-gradle:library my-lib --directory backend --simpleName false --simplePackageName false
```

### 4. Common tasks

| Action                               | Command                                            |
| ------------------------------------ | -------------------------------------------------- |
| Build a project                      | `nx build my-project`                              |
| Serve an application                 | `nx serve my-app`                                  |
| Test a project                       | `nx test my-project`                               |
| Build a Docker image                 | `nx build-image my-app`                            |
| Run custom Gradle task               | `nx run-task my-project --task=clean --task=build` |
| Format a Java project                | `nx format --projects my-project`                  |
| Visualize project's dependency graph | `nx graph`                                         |

### 5. Executors

nx-gradle provides the `run-task` executor for all Gradle operations. Most targets (build, test, serve, etc.) internally use `run-task` to execute Gradle commands.

#### run-task

Execute arbitrary Gradle tasks on a project:

```bash
nx run-task my-project --task=clean --task=build
```

**Options:**

- `--task` (required) - Gradle task(s) to execute. Can be a string or array of strings
- `--projectPath` - Gradle project path (e.g., `:my-app`). Auto-detected if not specified

**Examples:**

```bash
# Single task
nx run-task my-app --task=clean

# Multiple tasks
nx run-task my-app --task=clean --task=test --task=build

# With custom project path
nx run-task my-app --task=build --projectPath=:apps:my-app
```

**Note:** For Spring Boot, Quarkus, and Micronaut applications, the build-image target uses the `run-task` executor with framework-specific commands:

- Spring Boot: `bootBuildImage`
- Quarkus: `buildImage` (for JVM) or `buildNative` (for native)
- Micronaut: `dockerBuild`

### 6. Plugin configuration

The init command configures the plugin in your `nx.json` file. You can customize these options to fit your workspace needs.

**Example configuration with default values:**

```json
{
  "plugins": [
    {
      "plugin": "@jnxplus/nx-gradle",
      "options": {
        "gradleRootDirectory": "nx-gradle",
        "buildTargetName": "build",
        "testTargetName": "test",
        "serveTargetName": "serve",
        "integrationTestTargetName": "integration-test",
        "buildImageTargetName": "build-image"
      }
    }
  ]
}
```

**Available options:**

- `gradleRootDirectory` - Subdirectory for Gradle files (default: workspace root)
- `buildTargetName` - Name for the build target (default: build)
- `testTargetName` - Name for the test target (default: test)
- `serveTargetName` - Name for the serve target (default: serve)
- `integrationTestTargetName` - Name for the integration test target (default: integration-test)
- `buildImageTargetName` - Name for the build image target (default: build-image)

### 7. Environment variables

You can customize nx-gradle behavior using environment variables:

#### NX_SKIP_GRADLE_WRAPPER

Controls whether to skip using the Gradle wrapper and use the system `gradle` command instead.

**Examples:**

```bash
# Linux/macOS
export NX_SKIP_GRADLE_WRAPPER=true
nx build my-app

# Windows (PowerShell)
$env:NX_SKIP_GRADLE_WRAPPER='true'
nx build my-app

# Windows (CMD)
set NX_SKIP_GRADLE_WRAPPER=true
nx build my-app
```

**Default behavior (when not set):**

- Uses `gradlew` (Gradle wrapper) if it exists in the workspace
- Falls back to `gradle` if wrapper doesn't exist

#### NX_GRADLE_CLI_OPTS

Pass additional arguments to Gradle commands globally. Useful for CI/CD environments or consistent build settings.

**Examples:**

```bash
# Linux/macOS - disable build cache and enable info logging
export NX_GRADLE_CLI_OPTS='--no-build-cache --info'
nx build my-app

# Windows (PowerShell) - run in daemon mode
$env:NX_GRADLE_CLI_OPTS='--daemon'
nx test my-app

# Windows (CMD) - use offline mode
set NX_GRADLE_CLI_OPTS=--offline
nx build my-app
```

**Common options:**

- `--no-build-cache` - Disable Gradle build cache
- `--offline` - Work offline (use cached dependencies only)
- `--info` - Set log level to info
- `--daemon` / `--no-daemon` - Use or don't use the Gradle daemon
- `--parallel` / `--no-parallel` - Enable or disable parallel project execution

#### Using a .env file

Create a `.env` file in your workspace root to persist environment variables across sessions:

```bash
# .env file example
NX_SKIP_GRADLE_WRAPPER=false
NX_GRADLE_CLI_OPTS=--no-build-cache --info
```

**Note:** The `.env` file is automatically loaded by Nx. Variables defined here will be available to all nx-gradle commands.

### 8. Visualizing the project graph

Nx provides a powerful project graph visualization to understand dependencies between your Gradle projects:

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

**How nx-gradle builds the graph:**

- **Project dependencies** - Extracted by running `:projectDependencyTask` (a custom Gradle task from the gradle-plugin package)
- **Implementation dependencies** - Dependencies declared with `implementation`, `api`, etc.
- **Test dependencies** - Dependencies declared with `testImplementation`

The plugin executes a Gradle task that outputs project structure information, which Nx then uses to build the dependency graph.

This integration allows Nx to:

- Run only affected tests when you make changes
- Build projects in the correct order
- Cache and distribute builds efficiently

### 9. Project tagging

All projects generated by nx-gradle are automatically tagged with `nx-gradle`. This allows you to:

**Target Gradle projects specifically:**

```bash
# Run tests only on Gradle projects
nx run-many -t test --projects=tag:nx-gradle

# Build all Gradle projects
nx run-many -t build --projects=tag:nx-gradle

# Lint only Gradle projects
nx run-many -t lint --projects=tag:nx-gradle
```

**Filter in the project graph:**

```bash
# Show only Gradle projects in the graph
nx graph --projects=tag:nx-gradle
```

**Custom tags:**

You can add additional tags when generating projects using the `--tags` option:

```bash
# Add custom tags
nx generate @jnxplus/nx-gradle:application my-app --tags=backend,api

# Projects will have both auto and custom tags: ['nx-gradle', 'backend', 'api']
```

### 10. Version management strategies

nx-gradle supports two approaches for managing dependency versions across projects:

#### Version Catalog (recommended)

Gradle's modern approach using a centralized TOML file (`gradle/libs.versions.toml`):

```toml
[versions]
spring-boot = "3.2.0"
junit = "5.10.0"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
```

**In build.gradle:**

```groovy
dependencies {
    implementation libs.spring.boot.starter.web
    testImplementation libs.junit.jupiter
}
```

**Benefits:**

- Type-safe dependency references
- Centralized version management
- IDE auto-completion support
- Recommended by Gradle for modern projects

#### Properties file

Traditional approach using `gradle.properties`:

```properties
springBootVersion=3.2.0
junitVersion=5.10.0
```

**In build.gradle:**

```groovy
dependencies {
    implementation "org.springframework.boot:spring-boot-starter-web:${springBootVersion}"
    testImplementation "org.junit.jupiter:junit-jupiter:${junitVersion}"
}
```

**When to use:**

- Legacy projects migrating to Nx
- Simpler setup for small projects
- Team familiarity with this approach

### 11. Build DSL: Groovy vs Kotlin

nx-gradle supports both Gradle DSL options:

#### Groovy DSL (build.gradle)

Traditional Gradle syntax, easier to learn:

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.junit.jupiter:junit-jupiter'
}
```

#### Kotlin DSL (build.gradle.kts)

Type-safe, modern approach with better IDE support:

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.2.0"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.junit.jupiter:junit-jupiter")
}
```

**Choose Groovy if:**

- You prefer simpler syntax
- Most Gradle documentation uses Groovy
- Team is more familiar with Groovy

**Choose Kotlin if:**

- You want type safety and better IDE support
- Your team uses Kotlin for application code
- You prefer modern Gradle practices

**Note:** The DSL is set workspace-wide during init and should remain consistent across all projects.

### 12. Other generators

#### Preset

The preset generator is used when creating a new Nx workspace with Gradle support from scratch:

```bash
npx create-nx-workspace@latest my-workspace --preset=@jnxplus/nx-gradle
```

This combines workspace creation and Gradle initialization in one step.

#### Wrapper

Update or add the Gradle wrapper to your workspace:

```bash
nx generate @jnxplus/nx-gradle:wrapper
```

**Options:**

- `--skipFormat` - Skip formatting files (default: false)

Use this generator to:

- Update to the latest Gradle wrapper version
- Add the wrapper if it was skipped during init (`--skipWrapper`)
- Restore the wrapper if it was accidentally deleted

## License

MIT © 2021-2025 Khalil LAGRIDA
