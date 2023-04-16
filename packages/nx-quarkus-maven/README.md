# @jnxplus/nx-quarkus-maven

[![npm version](https://badge.fury.io/js/@jnxplus%2Fnx-quarkus-maven.svg)](https://badge.fury.io/js/@jnxplus%2Fnx-quarkus-maven)

This plugin adds Quarkus and Maven multi-module capabilities to Nx workspace.

Here is a quick overview of the plugin, to know more, please visit [the documentation](https://khalilou88.github.io/jnxplus/).

## Nx supported versions

The supported versions are:

| @jnxplus/nx-quarkus-maven | Nx     | Quarkus      |
| ------------------------- | ------ | ------------ |
| 0.x.x                     | 15.x.x | 2.16.6.Final |

## Getting Started

### 0. Prerequisites

`@jnxplus/nx-quarkus-maven` requires a Java 17 or higher Runtime Environment and the current Long Term Support (LTS) version of node.js.

### 1. Install the plugin

In the Nx workspace root folder, run this command to install the plugin :

```bash
npm install --save-dev @jnxplus/nx-quarkus-maven
```

### 2. Add Quarkus and Maven wrapper support

The following command adds Quarkus and Maven support (Maven wrapper and config files) to the workspace. This only needs to be performed once per workspace.

```bash
nx generate @jnxplus/nx-quarkus-maven:init
```

### 3. Usage

| Action                               | Command                                                         |
| ------------------------------------ | --------------------------------------------------------------- |
| Generate an application              | `nx generate @jnxplus/nx-quarkus-maven:application my-app-name` |
| Generate a library                   | `nx generate @jnxplus/nx-quarkus-maven:library my-lib-name`     |
| Build a project                      | `nx build my-project-name`                                      |
| Serve an application                 | `nx serve my-app-name`                                          |
| Test a project                       | `nx test my-project-name`                                       |
| Integration Test an application      | `nx integration-test my-app-name`                               |
| Lint a project                       | `nx lint my-project-name`                                       |
| Format a java project                | `nx format --projects my-project-name`                          |
| Format a kotlin project              | `nx ktformat my-project-name`                                   |
| Visualize project's dependency graph | `nx dep-graph`                                                  |

## License

MIT © 2023-2023 Khalil LAGRIDA
