import { readXml } from '@jnxplus/xml';
import {
  CreateNodes,
  TargetConfiguration,
  readJsonFile,
  workspaceRoot,
} from '@nx/devkit';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as cache from 'memory-cache';
import * as path from 'path';
import { XmlDocument } from 'xmldoc';
import { getExecutable, getMavenRootDirectory } from '../utils';

export const createNodes: CreateNodes = [
  '**/pom.xml',
  (pomXmlFilePath: string) => {
    let projectName;
    const projectRoot = path.dirname(pomXmlFilePath);
    let targets: {
      [targetName: string]: TargetConfiguration;
    } = {};

    const projectPath = path.join(workspaceRoot, projectRoot);
    const projectJsonPath = path.join(projectPath, 'project.json');

    const mavenRootDirectory = getMavenRootDirectory();
    const mavenRootDirAbsolutePath = path.join(
      workspaceRoot,
      mavenRootDirectory,
    );

    if (existsSync(projectJsonPath)) {
      const projectJson = readJsonFile(projectJsonPath);
      projectName = projectJson.name;
      targets = projectJson.targets;
      for (const [targetName] of Object.entries(targets ?? {})) {
        if (
          (targets[targetName].outputs ?? []).some(
            (element: string) => element === '{options.outputDirLocalRepo}',
          )
        ) {
          const pomXmlContent = readXml(pomXmlFilePath);
          const artifactId = getArtifactId(pomXmlContent);
          const groupId = getGroupId(artifactId, pomXmlContent);
          const projectVersion = getVersion(
            artifactId,
            pomXmlContent,
            mavenRootDirAbsolutePath,
            projectPath,
          );
          const localRepositoryLocation = getLocalRepositoryLocation(
            mavenRootDirAbsolutePath,
          );

          const outputDirLocalRepo = getOutputDirLocalRepo(
            localRepositoryLocation,
            groupId,
            artifactId,
            projectVersion,
          );

          targets[targetName].options = {
            outputDirLocalRepo: outputDirLocalRepo,
            ...targets[targetName].options,
          };
        }
      }
    } else {
      const pomXmlContent = readXml(pomXmlFilePath);
      const artifactId = getArtifactId(pomXmlContent);
      const groupId = getGroupId(artifactId, pomXmlContent);
      const projectVersion = getVersion(
        artifactId,
        pomXmlContent,
        mavenRootDirAbsolutePath,
        projectPath,
      );
      const localRepositoryLocation = getLocalRepositoryLocation(
        mavenRootDirAbsolutePath,
      );

      const outputDirLocalRepo = getOutputDirLocalRepo(
        localRepositoryLocation,
        groupId,
        artifactId,
        projectVersion,
      );

      projectName = artifactId;
      let outputs;
      if (isPomPackaging(pomXmlContent)) {
        outputs = ['{options.outputDirLocalRepo}'];
      } else {
        outputs = ['{projectRoot}/target', '{options.outputDirLocalRepo}'];
      }
      targets = {
        build: {
          executor: '@jnxplus/nx-maven:run-task',
          outputs: outputs,
          options: {
            outputDirLocalRepo: outputDirLocalRepo,
            task: getTask(projectRoot),
          },
        },
      };
    }

    return {
      projects: {
        [projectRoot]: {
          name: projectName,
          root: projectRoot,
          targets: targets,
          tags: ['nx-maven'],
        },
      },
    };
  },
];

function getParentGroupId(
  artifactId: string,
  pomXmlContent: XmlDocument,
): string {
  const parentXml = pomXmlContent.childNamed('parent');

  if (parentXml === undefined) {
    throw new Error(`Parent tag not found for project ${artifactId}`);
  }

  const groupIdXml = parentXml.childNamed('groupId');

  if (groupIdXml === undefined) {
    throw new Error(`ParentGroupId not found for project ${artifactId}`);
  }

  return groupIdXml?.val;
}

function getGroupId(artifactId: string, pomXmlContent: XmlDocument) {
  const groupIdXml = pomXmlContent.childNamed('groupId');
  if (groupIdXml === undefined) {
    return getParentGroupId(artifactId, pomXmlContent);
  }
  return groupIdXml.val;
}

function getArtifactId(pomXmlContent: XmlDocument) {
  const artifactIdXml = pomXmlContent.childNamed('artifactId');
  if (artifactIdXml === undefined) {
    throw new Error(`ArtifactId not found in pom.xml`);
  }
  return artifactIdXml.val;
}

function getOutputDirLocalRepo(
  localRepositoryLocation: string,
  groupId: string,
  artifactId: string,
  projectVersion: string,
) {
  return path.join(
    localRepositoryLocation,
    `${groupId.replace(
      new RegExp(/\./, 'g'),
      '/',
    )}/${artifactId}/${projectVersion}`,
  );
}

function getTask(projectRoot: string) {
  if (!projectRoot || projectRoot === '.') {
    return 'install -N';
  }

  return 'install';
}

function getLocalRepositoryLocation(mavenRootDirAbsolutePath: string) {
  const key = 'localRepositoryLocation';
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData;
  }

  const regexp = /<localRepository>(.+?)<\/localRepository>/g;
  const command = `${getExecutable()} help:effective-settings`;

  const data = runCommandAndExtractRegExp(
    command,
    mavenRootDirAbsolutePath,
    regexp,
  );

  // Store data in cache for future use
  cache.put(key, data, 60000); // Cache for 60 seconds

  return data;
}

function isPomPackaging(pomXmlContent: XmlDocument): boolean {
  const packagingXml = pomXmlContent.childNamed('packaging');

  if (packagingXml === undefined) {
    return false;
  }

  return packagingXml.val === 'pom';
}

function runCommandAndExtractRegExp(
  command: string,
  mavenRootDirAbsolutePath: string,
  regexp: RegExp,
) {
  const objStr = execSync(command, {
    cwd: mavenRootDirAbsolutePath,
  }).toString();

  const matches = (objStr.match(regexp) || []).map((e) =>
    e.replace(regexp, '$1'),
  );
  return matches[0];
}

function getVersion(
  artifactId: string,
  pomXmlContent: XmlDocument,
  mavenRootDirAbsolutePath: string,
  projectPath: string,
) {
  let version;
  const versionXml = pomXmlContent.childNamed('version');
  if (versionXml === undefined) {
    version = getParentVersion(artifactId, pomXmlContent);
  } else {
    version = versionXml.val;
  }

  if (version.indexOf('${') >= 0) {
    version = getEffectiveVersion(mavenRootDirAbsolutePath, projectPath);
  }

  return version;
}

function getParentVersion(
  artifactId: string,
  pomXmlContent: XmlDocument,
): string {
  const parentXml = pomXmlContent.childNamed('parent');

  if (parentXml === undefined) {
    throw new Error(`Parent tag not found for project ${artifactId}`);
  }

  const versionXml = parentXml.childNamed('version');

  if (versionXml === undefined) {
    throw new Error(`ParentVersion not found for project ${artifactId}`);
  }

  return versionXml?.val;
}

function getEffectiveVersion(
  mavenRootDirAbsolutePath: string,
  projectPath: string,
): string {
  const pomRelativePath = path.relative(mavenRootDirAbsolutePath, projectPath);
  const version = execSync(
    `${getExecutable()} -f ${pomRelativePath} help:evaluate -Dexpression=project.version -q -DforceStdout`,
    {
      cwd: mavenRootDirAbsolutePath,
    },
  )
    .toString()
    .trim();

  return version;
}
