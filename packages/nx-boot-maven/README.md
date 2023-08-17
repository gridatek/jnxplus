# Plugin deprecated

Plugin deprecated, use @jnxplus/nx-maven instead.

# @jnxplus/nx-boot-maven

[![npm version](https://badge.fury.io/js/@jnxplus%2Fnx-boot-maven.svg)](https://badge.fury.io/js/@jnxplus%2Fnx-boot-maven)

This plugin adds Spring Boot and Maven multi-module capabilities to Nx workspace.

Here is a quick overview of the plugin, to know more, please visit [the documentation](https://khalilou88.github.io/jnxplus/).

## Supported versions

| @jnxplus/nx-boot-maven | Nx version range    | Spring Boot |
| ---------------------- | ------------------- | ----------- |
| 7.x.x                  | >=16.3.0            | 3.x.x       |
| 6.x.x                  | >=16.0.0 && <16.3.0 | 3.x.x       |
| 5.x.x                  | 15.x.x              | 3.x.x       |

## Getting Started

### 0. Prerequisites

`@jnxplus/nx-boot-maven` requires a Java 17 or higher Runtime Environment and the current Long Term Support (LTS) version of node.js.

### 1. Install the plugin

In the Nx workspace root folder, run this command to install the plugin :

```bash
npm install --save-dev @jnxplus/nx-boot-maven
```

### 2. Add Spring boot and Maven wrapper support

The following command adds Spring boot and Maven support (Maven wrapper and config files) to the workspace. This only needs to be performed once per workspace.

```bash
nx generate @jnxplus/nx-boot-maven:init
```

### 3. Usage

| Action                               | Command                                                               |
| ------------------------------------ | --------------------------------------------------------------------- |
| Generate an application              | `nx generate @jnxplus/nx-boot-maven:application my-app-name`          |
| Generate a library                   | `nx generate @jnxplus/nx-boot-maven:library my-lib-name`              |
| Generate a parent project            | `nx generate @jnxplus/nx-boot-maven:parent-project my-parent-project` |
| Build a project                      | `nx build my-project-name`                                            |
| Serve an application                 | `nx serve my-app-name`                                                |
| Test a project                       | `nx test my-project-name`                                             |
| Lint a project                       | `nx lint my-project-name`                                             |
| Format a java project                | `nx format --projects my-project-name`                                |
| Format a kotlin project              | `nx ktformat my-project-name`                                         |
| Run a custom task                    | `nx run-task my-project-name --task="clean install -DskipTests=true"` |
| Publish a project                    | `nx publish my-project-name`                                          |
| Visualize project's dependency graph | `nx graph`                                                            |

## License

MIT © 2021-2023 Khalil LAGRIDA
