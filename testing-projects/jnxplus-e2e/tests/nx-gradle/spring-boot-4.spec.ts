import { normalizeName } from '@jnxplus/common';
import {
  createTestWorkspace,
  getData,
  killProcessAndPorts,
  runNxCommandUntil,
} from '@jnxplus/internal/testing';
import { names } from '@nx/devkit';
import {
  checkFilesExist,
  readFile,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nx/plugin/testing';
import { execSync } from 'child_process';
import { rmSync } from 'fs';

describe('nx-gradle spring-boot-4 e2e', () => {
  let workspaceDirectory: string;

  const rootProjectName = uniq('root-project-');

  beforeAll(async () => {
    workspaceDirectory = createTestWorkspace();

    execSync(`npm install -D @jnxplus/nx-gradle@e2e`, {
      cwd: workspaceDirectory,
      stdio: 'inherit',
      env: process.env,
    });

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:init --rootProjectName ${rootProjectName} --preset spring-boot-4`,
    );
  }, 120000);

  afterAll(async () => {
    if (process.env['SKIP_E2E_CLEANUP'] !== 'true') {
      rmSync(workspaceDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  it('should init the workspace with spring-boot-4 preset', async () => {
    const packageJson = readJson('package.json');
    expect(packageJson.devDependencies['@jnxplus/nx-gradle']).toBeTruthy();

    expect(() =>
      checkFilesExist(
        'gradle/wrapper/gradle-wrapper.jar',
        'gradle/wrapper/gradle-wrapper.properties',
        'gradlew',
        'gradlew.bat',
        'gradle.properties',
        'settings.gradle',
      ),
    ).not.toThrow();

    // Check gradle.properties contains Spring Boot 4 version
    const gradleProperties = readFile('gradle.properties');
    expect(gradleProperties.includes('springBootVersion=4.0.0')).toBeTruthy();
  }, 120000);

  it('should create a java application with spring-boot-4', async () => {
    const appName = uniq('g-sb4-app-');

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:application ${appName} --framework spring-boot-4`,
    );

    expect(() =>
      checkFilesExist(
        `apps/${appName}/build.gradle`,
        `apps/${appName}/src/main/resources/application.properties`,
        `apps/${appName}/src/main/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/${
          names(appName).className
        }Application.java`,
        `apps/${appName}/src/main/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/HelloController.java`,
      ),
    ).not.toThrow();

    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');

    const process = await runNxCommandUntil(`serve ${appName}`, (output) =>
      output.includes(`Tomcat started on port 8080`),
    );

    const dataResult = await getData();
    expect(dataResult.status).toEqual(200);
    expect(dataResult.message).toMatch('Hello World!');

    await killProcessAndPorts(process.pid, 8080);
  }, 240000);

  it('should create a kotlin application with spring-boot-4', async () => {
    const appName = uniq('g-sb4-app-');
    const port = 8181;

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:application ${appName} --framework spring-boot-4 --language kotlin --port ${port}`,
    );

    expect(() =>
      checkFilesExist(
        `apps/${appName}/build.gradle`,
        `apps/${appName}/src/main/resources/application.properties`,
        `apps/${appName}/src/main/kotlin/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/${
          names(appName).className
        }Application.kt`,
        `apps/${appName}/src/main/kotlin/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/HelloController.kt`,
      ),
    ).not.toThrow();

    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');

    const process = await runNxCommandUntil(`serve ${appName}`, (output) =>
      output.includes(`Tomcat started on port ${port}`),
    );

    const dataResult = await getData(port);
    expect(dataResult.status).toEqual(200);
    expect(dataResult.message).toMatch('Hello World!');

    await killProcessAndPorts(process.pid, port);
  }, 240000);

  it('should create a java library with spring-boot-4', async () => {
    const libName = uniq('g-sb4-lib-');

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:library ${libName} --framework spring-boot-4`,
    );

    expect(() =>
      checkFilesExist(
        `libs/${libName}/build.gradle`,
        `libs/${libName}/src/main/java/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloService.java`,
        `libs/${libName}/src/test/java/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloServiceTests.java`,
      ),
    ).not.toThrow();

    const buildResult = await runNxCommandAsync(`build ${libName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

    const testResult = await runNxCommandAsync(`test ${libName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');
  }, 120000);

  it('should create a kotlin library with spring-boot-4', async () => {
    const libName = uniq('g-sb4-lib-');

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:library ${libName} --framework spring-boot-4 --language kotlin`,
    );

    expect(() =>
      checkFilesExist(
        `libs/${libName}/build.gradle`,
        `libs/${libName}/src/main/kotlin/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloService.kt`,
        `libs/${libName}/src/test/kotlin/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloServiceTests.kt`,
      ),
    ).not.toThrow();

    const buildResult = await runNxCommandAsync(`build ${libName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

    const testResult = await runNxCommandAsync(`test ${libName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');
  }, 120000);

  it('should add a lib to an app dependencies', async () => {
    const appName = uniq('g-sb4-app-');
    const libName = uniq('g-sb4-lib-');

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:application ${appName} --framework spring-boot-4`,
    );

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:library ${libName} --framework spring-boot-4 --projects ${appName}`,
    );

    const buildGradle = readFile(`apps/${appName}/build.gradle`);
    expect(buildGradle.includes(`:${libName}`)).toBeTruthy();

    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

    await runNxCommandAsync(`dep-graph --file=dep-graph.json`);
    const depGraphJson = readJson('dep-graph.json');
    expect(depGraphJson.graph.nodes[appName]).toBeDefined();
    expect(depGraphJson.graph.nodes[libName]).toBeDefined();

    expect(depGraphJson.graph.dependencies[appName]).toContainEqual({
      type: 'static',
      source: appName,
      target: libName,
    });
  }, 120000);
});
