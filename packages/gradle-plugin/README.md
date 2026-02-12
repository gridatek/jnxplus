# io.github.khalilou88.jnxplus

This repository contains Gradle plugin for managing gradle projects inside a nx workspace. Plugin registers task `projectDependencyTask` that generate project dependencies in a json file.

## Compatibility

| Plugin Version | Gradle Version |
| -------------- | -------------- |
| 1.x            | Gradle 9.x     |
| 0.x            | Gradle 8.x     |

**Note:** Version 1.0.0+ uses updated APIs compatible with Gradle 9. If you're using Gradle 8.x, please use version 0.4.0 or earlier.

## Installation

### gradle.properties

```bash
jnxplusGradlePluginVersion=1.0.0
```

### Settings.gradle

Kotlin:

```bash
val jnxplusGradlePluginVersion: String by settings
plugins {
    id("io.github.khalilou88.jnxplus") version jnxplusGradlePluginVersion
}
```

Groovy:

```bash
plugins {
    id 'io.github.khalilou88.jnxplus' version "${jnxplusGradlePluginVersion}"
}
```

### build.gradle

Kotlin:

```bash
plugins {
    id("io.github.khalilou88.jnxplus")
}
```

Groovy:

```bash
plugins {
    id 'io.github.khalilou88.jnxplus'
}
```

## Usage

```bash
./gradlew :projectDependencyTask --outputFile=nx-gradle-deps.json
```

## License

MIT © 2023-2026 Khalil LAGRIDA
