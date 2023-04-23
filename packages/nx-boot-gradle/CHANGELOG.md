# Changelog

# 6.0.0 (2023-05-xx) - not yet published

- Update to NX 16
- Add simpleName and skipStarterCode options to app and lib generators
- Rework lint and kformat executors to remove dependencies to checkstyle, ktlint and pmd projects
- Bug Fixes

## BREAKING CHANGES

- App and lib generators : Remove packageNameType option and add instead simplePackageName option
- Lint executor with PMD option : to use PMD, you need to install it on your machine. Please follow this link for the instruction : https://docs.pmd-code.org/latest/pmd_userdocs_installation.html#running-pmd-via-command-line

# 5.3.0 (2023-04-10)

- Add root project to the dep graph

# 5.2.1 (2023-04-08)

- Init Generator : Fix when prettierignore don't exist

# 5.2.0 (2023-04-06)

- Calculate dep graph for all gradle projects

# 5.1.0 (2023-04-05)

- Add run-task executor
- Update Nx to version 15.8.7

# 5.0.0 (2022-12-25)

- Add Spring Boot 3 support

# 3.1.0 (2022-12-03)

- Remove dash from packageName when generating apps and libs
- Update Nx to version 15.2.4

# 3.0.0 (2022-11-28)

- Update Nx to version 15

# 2.5.1 (2022-09-20)

- Fix plugin install with better use of peerDependencies and dependencies

# 2.4.0 (2022-08-26)

- Use peerDependencies
- Add packageNameType option to choose between short and long packageName
- Update Nx to latest version (14.5.10)

# 2.3.0 (2022-06-24)

- Run commands from workspace root
- Update Nx

# 2.2.1 (2022-06-14)

- Fix serve app with no args
- Update Nx

# 2.2.0 (2022-06-10)

- Update Nx to version 14.2.4

# 2.1.1 (2022-06-10)

- Use patch release for deps

# 2.1.0 (2022-06-09)

- Add args to serve executor
- Update Nx

# 2.0.1 (2022-04-27)

- Update Nx

# 2.0.0 (2022-04-22)

- Upgrade to Nx 14

# 1.5.2 (2022-03-16)

- Init Generator : fix javaVersion type to match string and number

# 1.5.1 (2022-03-09)

- Make graph backward compatible

# 1.5.0 (2022-03-08)

- new build-image executor
- new migrate generator
- Refactor directory option

# 1.3.1 (2022-02-23)

- Fix dep graph for libs inside folders

# 1.3.0 (2022-02-15)

- Update Gradle wrapper and spring boot versions

# 1.2.1 (2022-01-31)

- Update lint deps

# 1.2.0 (2022-01-25)

- Fix lint kotlin projects
- Add kformat to format kotlin projects

# 1.1.0 (2022-01-04)

This release contains some deps update.

# 1.0.2 (2021-12-24)

This release adds Nx 13 support.
For Nx 12, use the version < 1.
