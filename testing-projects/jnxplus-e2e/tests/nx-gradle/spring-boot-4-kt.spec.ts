import { normalizeName } from '@jnxplus/common';
import {
  checkFilesDoNotExist,
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
  tmpProjPath,
  uniq,
  updateFile,
} from '@nx/plugin/testing';
import { execSync } from 'child_process';
import { rmSync } from 'fs';
import * as path from 'path';

describe('nx-gradle spring-boot-4 kotlin dsl e2e', () => {
  let workspaceDirectory: string;
  const isCI =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const isWin = process.platform === 'win32';
  const isMacOs = process.platform === 'darwin';

  const rootProjectName = uniq('root-project-');

  beforeAll(async () => {
    workspaceDirectory = createTestWorkspace();

    execSync(`npm install -D @jnxplus/nx-gradle@e2e`, {
      cwd: workspaceDirectory,
      stdio: 'inherit',
      env: process.env,
    });

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:init --gradleRootDirectory . --dsl kotlin --rootProjectName ${rootProjectName} --preset spring-boot-4`,
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

  it('should set NX_VERBOSE_LOGGING to true', async () => {
    expect(process.env['NX_VERBOSE_LOGGING']).toBe('true');
  }, 120000);

  it('should use dsl option when initiating the workspace with spring-boot-4', async () => {
    const packageJson = readJson('package.json');
    expect(packageJson.devDependencies['@jnxplus/nx-gradle']).toBeTruthy();

    expect(() =>
      checkFilesExist(
        'gradle/wrapper/gradle-wrapper.jar',
        'gradle/wrapper/gradle-wrapper.properties',
        'gradlew',
        'gradlew.bat',
        'gradle.properties',
        'settings.gradle.kts',
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
        `apps/${appName}/build.gradle.kts`,
        `apps/${appName}/src/main/resources/application.properties`,
        `apps/${appName}/src/main/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/${
          names(appName).className
        }Application.java`,
        `apps/${appName}/src/main/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/HelloController.java`,
        `apps/${appName}/src/test/resources/application.properties`,
        `apps/${appName}/src/test/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/HelloControllerTests.java`,
      ),
    ).not.toThrow();

    const settingsGradle = readFile('settings.gradle.kts');
    expect(settingsGradle.includes(`:${appName}`)).toBeTruthy();

    const buildGradle = readFile(`apps/${appName}/build.gradle.kts`);
    expect(buildGradle.includes('com.example')).toBeTruthy();
    expect(buildGradle.includes('0.0.1-SNAPSHOT')).toBeTruthy();

    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');

    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

    const process = await runNxCommandUntil(`serve ${appName}`, (output) =>
      output.includes(`Tomcat started on port 8080`),
    );

    const dataResult = await getData();
    expect(dataResult.status).toEqual(200);
    expect(dataResult.message).toMatch('Hello World!');

    await killProcessAndPorts(process.pid, 8080);
  }, 240000);

  it('should build-image a java application', async () => {
    if (!isWin && !isMacOs && isCI) {
      const appName = uniq('g-sb4-app-');
      await runNxCommandAsync(
        `generate @jnxplus/nx-gradle:application ${appName} --framework spring-boot-4`,
      );
      const buildImageResult = await runNxCommandAsync(
        `build-image ${appName}`,
      );
      expect(buildImageResult.stdout).toContain('Executor ran for Build Image');
    }
  }, 120000);

  it('should create a kotlin application with spring-boot-4', async () => {
    const appName = uniq('g-sb4-app-');
    const port = 8181;

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:application ${appName} --framework spring-boot-4 --language kotlin --port ${port}`,
    );

    expect(() =>
      checkFilesExist(
        `apps/${appName}/build.gradle.kts`,
        `apps/${appName}/src/main/resources/application.properties`,
        `apps/${appName}/src/main/kotlin/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/${
          names(appName).className
        }Application.kt`,
        `apps/${appName}/src/main/kotlin/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/HelloController.kt`,
        `apps/${appName}/src/test/resources/application.properties`,
        `apps/${appName}/src/test/kotlin/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/${
          names(appName).className
        }ApplicationTests.kt`,
      ),
    ).not.toThrow();

    const buildGradle = readFile(`apps/${appName}/build.gradle.kts`);
    expect(buildGradle.includes('com.example')).toBeTruthy();
    expect(buildGradle.includes('0.0.1-SNAPSHOT')).toBeTruthy();

    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');

    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

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
        `libs/${libName}/build.gradle.kts`,
        `libs/${libName}/src/main/java/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloService.java`,
        `libs/${libName}/src/test/java/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/TestConfiguration.java`,
        `libs/${libName}/src/test/java/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloServiceTests.java`,
      ),
    ).not.toThrow();

    const buildGradle = readFile(`libs/${libName}/build.gradle.kts`);
    expect(buildGradle.includes('com.example')).toBeTruthy();
    expect(buildGradle.includes('0.0.1-SNAPSHOT')).toBeTruthy();

    const testResult = await runNxCommandAsync(`test ${libName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');

    const buildResult = await runNxCommandAsync(`build ${libName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');
  }, 120000);

  it('should create a kotlin library with spring-boot-4', async () => {
    const libName = uniq('g-sb4-lib-');

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:library ${libName} --framework spring-boot-4 --language kotlin`,
    );

    expect(() =>
      checkFilesExist(
        `libs/${libName}/build.gradle.kts`,
        `libs/${libName}/src/main/kotlin/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloService.kt`,
        `libs/${libName}/src/test/kotlin/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/TestConfiguration.kt`,
        `libs/${libName}/src/test/kotlin/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloServiceTests.kt`,
      ),
    ).not.toThrow();

    const buildGradle = readFile(`libs/${libName}/build.gradle.kts`);
    expect(buildGradle.includes('com.example')).toBeTruthy();
    expect(buildGradle.includes('0.0.1-SNAPSHOT')).toBeTruthy();

    const testResult = await runNxCommandAsync(`test ${libName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');

    const buildResult = await runNxCommandAsync(`build ${libName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');
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

    const buildGradle = readFile(`apps/${appName}/build.gradle.kts`);
    expect(buildGradle.includes(`:${libName}`)).toBeTruthy();

    const helloControllerPath = `apps/${appName}/src/main/java/com/example/${names(
      appName,
    ).className.toLocaleLowerCase()}/HelloController.java`;
    const helloControllerContent = readFile(helloControllerPath);

    const regex1 = /package\s*com\.example\..*\s*;/;
    const regex2 = /public\s*class\s*HelloController\s*{/;
    const regex3 = /"Hello World!"/;

    const newHelloControllerContent = helloControllerContent
      .replace(
        regex1,
        `$&\nimport org.springframework.beans.factory.annotation.Autowired;\nimport com.example.${names(
          libName,
        ).className.toLocaleLowerCase()}.HelloService;`,
      )
      .replace(regex2, '$&\n@Autowired\nprivate HelloService helloService;')
      .replace(regex3, 'this.helloService.message()');

    updateFile(helloControllerPath, newHelloControllerContent);

    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');

    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

    await runNxCommandAsync(`dep-graph --file=dep-graph.json`);
    const depGraphJson = readJson('dep-graph.json');
    expect(depGraphJson.graph.nodes[rootProjectName]).toBeDefined();
    expect(depGraphJson.graph.nodes[appName]).toBeDefined();
    expect(depGraphJson.graph.nodes[libName]).toBeDefined();

    expect(depGraphJson.graph.dependencies[appName]).toContainEqual({
      type: 'static',
      source: appName,
      target: libName,
    });
  }, 120000);

  it('should add a kotlin lib to a kotlin app dependencies', async () => {
    const appName = uniq('g-sb4-app-');
    const libName = uniq('g-sb4-lib-');

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:application ${appName} --framework spring-boot-4 --language kotlin --packaging war`,
    );

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:library ${libName} --framework spring-boot-4 --language kotlin --projects ${appName}`,
    );

    expect(() =>
      checkFilesExist(
        `apps/${appName}/src/main/kotlin/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/ServletInitializer.kt`,
      ),
    ).not.toThrow();

    const buildGradle = readFile(`apps/${appName}/build.gradle.kts`);
    expect(buildGradle.includes(`:${libName}`)).toBeTruthy();

    const helloControllerPath = `apps/${appName}/src/main/kotlin/com/example/${names(
      appName,
    ).className.toLocaleLowerCase()}/HelloController.kt`;
    const helloControllerContent = readFile(helloControllerPath);

    const regex1 = /package\s*com\.example\..*/;
    const regex2 = /class\s*HelloController/;
    const regex3 = /"Hello World!"/;

    const newHelloControllerContent = helloControllerContent
      .replace(
        regex1,
        `$&\nimport org.springframework.beans.factory.annotation.Autowired\nimport com.example.${names(
          libName,
        ).className.toLocaleLowerCase()}.HelloService`,
      )
      .replace(regex2, '$&(@Autowired val helloService: HelloService)')
      .replace(regex3, 'helloService.message()');

    updateFile(helloControllerPath, newHelloControllerContent);

    const testResult = await runNxCommandAsync(`test ${appName}`);
    expect(testResult.stdout).toContain('Executor ran for Test');

    const buildResult = await runNxCommandAsync(`build ${appName}`);
    expect(buildResult.stdout).toContain('Executor ran for Build');

    await runNxCommandAsync(`dep-graph --file=dep-graph.json`);
    const depGraphJson = readJson('dep-graph.json');
    expect(depGraphJson.graph.nodes[rootProjectName]).toBeDefined();
    expect(depGraphJson.graph.nodes[appName]).toBeDefined();
    expect(depGraphJson.graph.nodes[libName]).toBeDefined();

    expect(depGraphJson.graph.dependencies[appName]).toContainEqual({
      type: 'static',
      source: appName,
      target: libName,
    });
  }, 120000);

  it('should create a minimal java application', async () => {
    const appName = uniq('g-sb4-app-');
    const port = 8282;

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:application ${appName} --framework spring-boot-4 --minimal --port ${port}`,
    );

    expect(() =>
      checkFilesExist(
        `apps/${appName}/build.gradle.kts`,
        `apps/${appName}/src/main/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/${
          names(appName).className
        }Application.java`,
        `apps/${appName}/src/main/resources/application.properties`,
        `apps/${appName}/src/test/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/${
          names(appName).className
        }ApplicationTests.java`,
      ),
    ).not.toThrow();

    expect(() =>
      checkFilesDoNotExist(
        `apps/${appName}/src/main/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/HelloController.java`,
        `apps/${appName}/src/test/java/com/example/${names(
          appName,
        ).className.toLocaleLowerCase()}/HelloControllerTests.java`,
      ),
    ).not.toThrow();

    const process = await runNxCommandUntil(`serve ${appName}`, (output) =>
      output.includes(`Tomcat started on port ${port}`),
    );

    await killProcessAndPorts(process.pid, port);
  }, 120000);

  it('should skip starter code when generating a java library with skipStarterCode option', async () => {
    const libName = uniq('g-sb4-lib-');

    await runNxCommandAsync(
      `generate @jnxplus/nx-gradle:library ${libName} --framework spring-boot-4 --skipStarterCode`,
    );

    expect(() =>
      checkFilesExist(`libs/${libName}/build.gradle.kts`),
    ).not.toThrow();

    expect(() =>
      checkFilesDoNotExist(
        `libs/${libName}/src/main/java/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloService.java`,
        `libs/${libName}/src/test/java/com/example/${names(
          libName,
        ).className.toLocaleLowerCase()}/HelloServiceTests.java`,
      ),
    ).not.toThrow();
  }, 120000);
});
