import { readXml } from '@jnxplus/xml';
import {
  NxJsonConfiguration,
  joinPathFragments,
  normalizePath,
  readJsonFile,
  workspaceRoot,
} from '@nx/devkit';
import * as flatCache from 'flat-cache';
import * as path from 'path';
import { join } from 'path';
import { XmlDocument } from 'xmldoc';
import {
  getArtifactId,
  getGroupId,
  getLocalRepositoryPath,
  getMavenRootDirectory,
  getVersion,
} from '../utils';

export type MavenProjectType = {
  artifactId: string;
  groupId: string;
  version: string;
  isPomPackaging: boolean;
  projectRoot: string;
  projectAbsolutePath: string;
  dependencies: (string | undefined)[];
  parentProjectArtifactId?: string;
  aggregatorProjectArtifactId?: string;
};

export type WorkspaceDataType = {
  mavenRootDirAbsolutePath: string;
  targetDefaults: string[];
  localRepo: string;
  projects: MavenProjectType[];
};

const cacheId = 'workspace-data.json';
const cache = flatCache.load(
  cacheId,
  path.join(workspaceRoot, '.nx', 'cache', 'nx-maven'),
);
const key = 'workspace-data';

export function getWorkspaceData() {
  const mavenRootDirectory = getMavenRootDirectory();
  const mavenRootDirAbsolutePath = path.join(workspaceRoot, mavenRootDirectory);

  const projects: MavenProjectType[] = [];
  addProjects(mavenRootDirAbsolutePath, projects, '');

  const localRepositoryPath = getLocalRepositoryPath(mavenRootDirAbsolutePath);

  const data: WorkspaceDataType = {
    mavenRootDirAbsolutePath: mavenRootDirAbsolutePath,
    targetDefaults: getTargetDefaults(),
    localRepo: localRepositoryPath,
    projects: projects,
  };

  // Store data in cache for future use
  cache.setKey(key, data);
  cache.save();

  return data;
}

export function getCachedWorkspaceData() {
  return cache.getKey(key);
}

export function removeWorkspaceDataCache() {
  flatCache.clearCacheById(cacheId);
}

export function addProjects(
  mavenRootDirAbsolutePath: string,
  projects: MavenProjectType[],
  projectRelativePath: string,
  aggregatorProjectArtifactId?: string,
) {
  //projectAbsolutePath
  const projectAbsolutePath = join(
    mavenRootDirAbsolutePath,
    projectRelativePath,
  );
  const pomXmlPath = join(projectAbsolutePath, 'pom.xml');
  const pomXmlContent = readXml(pomXmlPath);

  //artifactId
  const artifactId = getArtifactId(pomXmlContent);

  const groupId = getGroupId(artifactId, pomXmlContent);

  const version = getVersion(artifactId, pomXmlContent);

  const isPomPackaging = isPomPackagingFunction(pomXmlContent);

  const projectRoot = normalizePath(
    path.relative(workspaceRoot, projectAbsolutePath),
  );

  const parentProjectArtifactId = getParentProjectName(pomXmlContent);

  const dependencies = getDependencyArtifactIds(pomXmlContent);
  projects.push({
    artifactId: artifactId,
    groupId: groupId,
    version: version,
    isPomPackaging: isPomPackaging,
    projectRoot: projectRoot,
    projectAbsolutePath: projectAbsolutePath,
    dependencies: dependencies,
    parentProjectArtifactId: parentProjectArtifactId,
    aggregatorProjectArtifactId: aggregatorProjectArtifactId,
  });

  const modulesXmlElement = pomXmlContent.childNamed('modules');
  if (modulesXmlElement === undefined) {
    return;
  }

  const moduleXmlElementArray = modulesXmlElement.childrenNamed('module');
  if (moduleXmlElementArray.length === 0) {
    return;
  }

  for (const moduleXmlElement of moduleXmlElementArray) {
    const moduleRelativePath = joinPathFragments(
      projectRelativePath,
      moduleXmlElement.val.trim(),
    );
    addProjects(
      mavenRootDirAbsolutePath,
      projects,
      moduleRelativePath,
      artifactId,
    );
  }
}

function getParentProjectName(pomXmlContent: XmlDocument): string | undefined {
  const parentXmlElement = pomXmlContent.childNamed('parent');
  if (parentXmlElement === undefined) {
    return undefined;
  }

  const relativePath = parentXmlElement.childNamed('relativePath')?.val;

  if (!relativePath) {
    return undefined;
  }

  return parentXmlElement.childNamed('artifactId')?.val;
}

function getDependencyArtifactIds(pomXml: XmlDocument) {
  const dependenciesXml = pomXml.childNamed('dependencies');
  if (dependenciesXml === undefined) {
    return [];
  }

  return dependenciesXml
    .childrenNamed('dependency')
    .map((dependencyXmlElement) => {
      return dependencyXmlElement.childNamed('artifactId')?.val;
    });
}

function isPomPackagingFunction(pomXmlContent: XmlDocument): boolean {
  const packagingXml = pomXmlContent.childNamed('packaging');

  if (packagingXml === undefined) {
    return false;
  }

  return packagingXml.val === 'pom';
}

export function getEffectiveVersion(
  artifactId: string,
  version: string,
  parentProjectArtifactId: string | undefined,
  mavenMonorepo: WorkspaceDataType,
) {
  if (version.indexOf('${') >= 0) {
    version = getParentProjectVersion(
      parentProjectArtifactId,
      mavenMonorepo.projects,
    );
  }

  return version;
}

function getParentProjectVersion(
  parentProjectArtifactId: string | undefined,
  projects: MavenProjectType[],
) {
  if (!parentProjectArtifactId) {
    return '${}';
  }

  const project = getProject(projects, parentProjectArtifactId);

  if (project.version.indexOf('${') === -1) {
    return project.version;
  }

  return getParentProjectVersion(project.parentProjectArtifactId, projects);
}

function getTargetDefaults() {
  const targetDefaults = [];
  const nxJsonPath = path.join(workspaceRoot, 'nx.json');

  const nxJson = readJsonFile<NxJsonConfiguration>(nxJsonPath);
  if (nxJson.targetDefaults) {
    for (const [targetName, target] of Object.entries(nxJson.targetDefaults)) {
      if (
        (target.outputs ?? []).some(
          (element: string) => element === '{options.outputDirLocalRepo}',
        )
      ) {
        targetDefaults.push(targetName);
      }
    }
  }

  return targetDefaults;
}

export function getProject(projects: MavenProjectType[], artifactId: string) {
  const project = projects.find((project) => project.artifactId === artifactId);

  if (!project) {
    throw new Error(`Project ${artifactId} not found`);
  }

  return project;
}
