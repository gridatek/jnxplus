import { CustomCli } from '@jnxplus/common';
import { getPackageManagerCommand } from '@nx/devkit';
import { exists, tmpProjPath } from '@nx/plugin/testing';
import axios from 'axios';
import * as chalk from 'chalk';
import { ChildProcess, exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { check as portCheck } from 'tcp-port-used';
import * as treeKill from 'tree-kill';
import { promisify } from 'util';
import kill = require('kill-port');

/**
 * Creates a test workspace with create-nx-workspace and installs the plugin
 * @returns The directory where the test workspace was created
 */
export function createTestWorkspace() {
  const workspaceName = 'proj';
  const workspaceDirectory = path.join(
    process.cwd(),
    'tmp',
    'nx-e2e',
    workspaceName,
  );

  // Ensure workspaceDirectory is empty
  fs.rmSync(workspaceDirectory, {
    recursive: true,
    force: true,
  });
  fs.mkdirSync(path.dirname(workspaceDirectory), {
    recursive: true,
  });

  execSync(
    `npx --yes create-nx-workspace@latest ${workspaceName} --preset apps --no-nxCloud --no-interactive`,
    {
      cwd: path.dirname(workspaceDirectory),
      stdio: 'inherit',
      env: process.env,
    },
  );
  console.log(`Created test project in "${workspaceDirectory}"`);

  return workspaceDirectory;
}

/**
 * Creates a test workspace with create-nx-maven-workspace or create-nx-gradle-workspace  and installs the plugin
 * @returns The directory where the test workspace was created
 */
export function createTestWorkspaceWithCustomCli(
  customCli: CustomCli,
  extraArgs = '',
) {
  const workspaceName = 'test-workspace';
  const workspaceDirectory = path.join(process.cwd(), 'tmp', workspaceName);

  // Ensure workspaceDirectory is empty
  fs.rmSync(workspaceDirectory, {
    recursive: true,
    force: true,
  });
  fs.mkdirSync(path.dirname(workspaceDirectory), {
    recursive: true,
  });

  execSync(`npx --yes ${customCli}@e2e ${workspaceName} ${extraArgs}`, {
    cwd: path.dirname(workspaceDirectory),
    stdio: 'inherit',
    env: process.env,
  });
  console.log(`Created test workspace in "${workspaceDirectory}"`);

  return workspaceDirectory;
}

/**
 * Remove log colors for fail proof string search
 * @param log
 * @returns
 */
function stripConsoleColors(log: string): string {
  return log.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );
}

export function runNxCommandUntil(
  command: string,
  criteria: (output: string) => boolean,
): Promise<ChildProcess> {
  const pmc = getPackageManagerCommand();
  const p = exec(`${pmc.exec} nx ${command}`, {
    cwd: tmpProjPath(),
    env: {
      ...process.env,
      FORCE_COLOR: 'false',
    },
    encoding: 'utf-8',
  });
  return new Promise((res, rej) => {
    let output = '';
    let complete = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function checkCriteria(c: any) {
      output += c.toString();
      if (criteria(stripConsoleColors(output)) && !complete) {
        complete = true;
        res(p);
      }
    }

    p.stdout?.on('data', checkCriteria);
    p.stderr?.on('data', checkCriteria);
    p.on('exit', (code) => {
      if (!complete) {
        rej(`Exited with ${code}`);
      } else {
        res(p);
      }
    });
  });
}

const KILL_PORT_DELAY = 5000;

export async function killPort(port: number): Promise<boolean> {
  if (await portCheck(port)) {
    try {
      logInfo(`Attempting to close port ${port}`);
      await kill(port);
      await new Promise<void>((resolve) =>
        setTimeout(() => resolve(), KILL_PORT_DELAY),
      );
      if (await portCheck(port)) {
        logError(`Port ${port} still open`);
      } else {
        logSuccess(`Port ${port} successfully closed`);
        return true;
      }
    } catch {
      logError(`Port ${port} closing failed`);
    }
    return false;
  } else {
    return true;
  }
}

const E2E_LOG_PREFIX = `${chalk.reset.inverse.bold.keyword('orange')(' E2E ')}`;

function e2eConsoleLogger(message: string, body?: string) {
  process.stdout.write('\n');
  process.stdout.write(`${E2E_LOG_PREFIX} ${message}\n`);
  if (body) {
    process.stdout.write(`${body}\n`);
  }
  process.stdout.write('\n');
}

export function logInfo(title: string, body?: string) {
  const message = `${chalk.reset.inverse.bold.white(
    ' INFO ',
  )} ${chalk.bold.white(title)}`;
  return e2eConsoleLogger(message, body);
}

export function logSuccess(title: string, body?: string) {
  const message = `${chalk.reset.inverse.bold.green(
    ' SUCCESS ',
  )} ${chalk.bold.green(title)}`;
  return e2eConsoleLogger(message, body);
}

export function logError(title: string, body?: string) {
  const message = `${chalk.reset.inverse.bold.red(' ERROR ')} ${chalk.bold.red(
    title,
  )}`;
  return e2eConsoleLogger(message, body);
}

export async function killPorts(port?: number): Promise<boolean> {
  return port
    ? await killPort(port)
    : (await killPort(3333)) && (await killPort(4200));
}

export const promisifiedTreeKill: (
  pid: number,
  signal: string,
) => Promise<void> = promisify(treeKill);

export function checkFilesDoNotExist(...expectedFiles: string[]) {
  expectedFiles.forEach((f) => {
    const ff = f.startsWith('/') ? f : tmpProjPath(f);
    if (exists(ff)) {
      throw new Error(`File '${ff}' should not exist`);
    }
  });
}

export const getData = async (port = 8080, path = '') => {
  const response = await axios.get(`http://127.0.0.1:${port}${path}`);
  return { status: response.status, message: response.data };
};

export function removeTmpFromGitignore() {
  const filePath = path.join(process.cwd(), '.gitignore');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const updatedFileContent = fileContent.replace('/tmp', '');
  fs.writeFileSync(filePath, updatedFileContent);
}

export function addTmpToGitignore() {
  const filePath = path.join(process.cwd(), '.gitignore');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const updatedFileContent = fileContent.concat('\n/tmp');
  fs.writeFileSync(filePath, updatedFileContent);
}

export function semver(s: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const regexp = /(\d+).(\d+).(\d+)/;

  const m = s.match(regexp);

  if (!m) {
    throw new Error(`Wrong version ${s}`);
  }

  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

export function ifNextVersionExists() {
  const objStr = execSync('npm view nx dist-tags').toString().trim();

  const jsonStr = objStr
    .replace(/'/g, '"')
    .replace(/(\w+:)|(\w+ :)/g, function (matchedStr: string) {
      return '"' + matchedStr.substring(0, matchedStr.length - 1) + '":';
    });

  const {
    latest,
    next,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    previous,
  }: { latest: string; next: string; previous: string } = JSON.parse(jsonStr);

  const latestVersion: { major: number; minor: number; patch: number } =
    semver(latest);

  const nextVersion: { major: number; minor: number; patch: number } =
    semver(next);

  if (nextVersion.major > latestVersion.major) {
    return true;
  }

  if (
    nextVersion.major === latestVersion.major &&
    nextVersion.minor > latestVersion.minor
  ) {
    return true;
  }

  if (
    nextVersion.major === latestVersion.major &&
    nextVersion.minor === latestVersion.minor &&
    nextVersion.patch > latestVersion.patch
  ) {
    return true;
  }

  return false;
}

export function addJVMMemory() {
  const gradlePropertiesPath = path.join(tmpProjPath(), 'gradle.properties');
  const gradlePropertiesContent = fs.readFileSync(
    gradlePropertiesPath,
    'utf-8',
  );
  const updatedFileContent = gradlePropertiesContent.concat(
    '\norg.gradle.jvmargs=-Xmx4096m',
  );
  fs.writeFileSync(gradlePropertiesPath, updatedFileContent);
}
