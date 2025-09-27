import {
  getBuildImageTargetName,
  getBuildTargetName,
  getIntegrationTestTargetName,
  getServeTargetName,
  getTestTargetName,
  NxMavenPluginOptions,
} from '@jnxplus/common';
import { readXml } from '@jnxplus/xml';
import {
  hashArray,
  joinPathFragments,
  logger,
  normalizePath,
  NxJsonConfiguration,
  readJsonFile,
  workspaceRoot,
  writeJsonFile,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { InputDefinition } from 'nx/src/config/workspace-json-project-json';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';
import { join, relative } from 'path';
import { XmlDocument, XmlElement } from 'xmldoc';
import {
  getArtifactId,
  getExpressionValue,
  getGroupId,
  getLocalRepositoryPath,
  getMavenRootDirectory,
  getPlugin,
  getSkipAggregatorProjectLinkingOption,
  getSkipProjectWithoutProjectJsonOption,
  getVersion,
} from '../utils';
import { hashObject } from 'nx/src/hasher/file-hasher';
import { hashWithWorkspaceContext } from 'nx/src/utils/workspace-context';

interface PropertyType {
  key: string;
  value: string;
}

export interface MavenProjectType {
  artifactId: string;
  groupId: string;
  version: string;
  isRootProject: boolean;
  isPomPackaging: boolean;
  projectRoot: string;
  projectAbsolutePath: string;
  dependencies: (string | undefined)[];
  profileDependencies: (string | undefined)[];
  pluginDependencies: (string | undefined)[];
  parentProjectArtifactId?: string;
  aggregatorProjectArtifactId?: string;
  properties: PropertyType[];
  skipProject: boolean;
}

export interface WorkspaceDataType {
  mavenRootDirAbsolutePath: string;
  targetDefaults: string[];
  localRepo: string;
  projects: Record<string, MavenProjectType>;
}

let NORMALIZED_OPTIONS_CACHE: NxMavenPluginOptions | undefined = undefined;
const WORKSPACE_DATA_PROMISE_CACHE: Map<
  string,
  Promise<WorkspaceDataType>
> = new Map();

export async function getWorkspaceData(
  opts?: NxMavenPluginOptions,
): Promise<WorkspaceDataType> {
  const normalizedOpts = getNormalizedOptions(opts);
  const cachePath = await getCachePath(normalizedOpts);

  // Check if we already have a promise for this cache path
  if (WORKSPACE_DATA_PROMISE_CACHE.has(cachePath)) {
    const cachedPromise = WORKSPACE_DATA_PROMISE_CACHE.get(cachePath);
    if (cachedPromise) {
      return cachedPromise;
    }
  }

  // Create and cache the promise
  const workspaceDataPromise = computeWorkspaceData(normalizedOpts, cachePath);
  WORKSPACE_DATA_PROMISE_CACHE.set(cachePath, workspaceDataPromise);

  try {
    return await workspaceDataPromise;
  } catch (error) {
    // Remove failed promise from cache so it can be retried
    WORKSPACE_DATA_PROMISE_CACHE.delete(cachePath);
    throw error;
  }
}

async function computeWorkspaceData(
  normalizedOpts: NxMavenPluginOptions,
  cachePath: string,
): Promise<WorkspaceDataType> {
  // Check file system cache first
  let data = readWorkspaceDataCache(cachePath);
  if (data) {
    return data;
  }

  const mavenRootDirAbsolutePath = join(
    workspaceRoot,
    normalizedOpts.mavenRootDirectory,
  );

  data = {
    mavenRootDirAbsolutePath,
    targetDefaults: getTargetDefaults(),
    localRepo: normalizedOpts.localRepoRelativePath,
    projects: {},
  };

  addProjects(data, normalizedOpts, normalizedOpts.mavenRootDirectory);

  // Store data in cache for future use
  writeWorkspaceDataToCache(cachePath, data);

  return data;
}

export function getNormalizedOptions(
  opts: NxMavenPluginOptions | undefined,
): NxMavenPluginOptions {
  if (!NORMALIZED_OPTIONS_CACHE) {
    const plugin = getPlugin();
    const mavenRootDirectory = getMavenRootDirectory(plugin);

    NORMALIZED_OPTIONS_CACHE = {
      buildTargetName: getBuildTargetName(plugin),
      testTargetName: getTestTargetName(plugin),
      serveTargetName: getServeTargetName(plugin),
      integrationTestTargetName: getIntegrationTestTargetName(plugin),
      buildImageTargetName: getBuildImageTargetName(plugin),
      mavenRootDirectory,
      localRepoRelativePath: getLocalRepositoryPath(
        opts,
        join(workspaceRoot, mavenRootDirectory),
      ),
      graphOptions: {
        skipAggregatorProjectLinking:
          getSkipAggregatorProjectLinkingOption(plugin),
        skipProjectWithoutProjectJson:
          getSkipProjectWithoutProjectJsonOption(plugin),
      },
    };
  }
  return NORMALIZED_OPTIONS_CACHE;
}

/**
 * Generate an hash filename matching all pom.xml content
 * If one pom.xml change, hash is invalidated
 *
 * @param normalizedOptions
 */
export async function getCachePath(normalizedOptions: object): Promise<string> {
  const hash = hashArray([
    await hashWithWorkspaceContext(workspaceRoot, ['pom.xml', '**/pom.xml']),
    hashObject(normalizedOptions),
  ]);
  return join(workspaceDataDirectory, `maven-workspace-data-${hash}.hash`);
}

export function readWorkspaceDataCache(
  cachePath: string,
): WorkspaceDataType | null {
  return process.env['NX_CACHE_PROJECT_GRAPH'] !== 'false' &&
    existsSync(cachePath)
    ? readJsonFile<WorkspaceDataType>(cachePath)
    : null;
}

export function writeWorkspaceDataToCache(
  cachePath: string,
  results: WorkspaceDataType,
) {
  writeJsonFile(cachePath, results);
}

export function addProjects(
  data: WorkspaceDataType,
  normalizedOpts: NxMavenPluginOptions,
  projectRelativePath: string,
  aggregatorProjectArtifactId?: string,
): void {
  const projectAbsolutePath = join(workspaceRoot, projectRelativePath);
  const pomXmlPath = join(projectAbsolutePath, 'pom.xml');

  const pomXmlContent = readXml(pomXmlPath);
  const artifactId = getArtifactId(pomXmlContent);
  const projectJsonPath = join(projectAbsolutePath, 'project.json');

  data.projects[artifactId] = {
    artifactId,
    groupId: getGroupId(artifactId, pomXmlContent),
    version: getVersion(artifactId, pomXmlContent),
    isRootProject: !aggregatorProjectArtifactId,
    isPomPackaging: isPomPackagingFunction(pomXmlContent),
    projectRoot: getProjectRoot(projectAbsolutePath),
    projectAbsolutePath,
    dependencies: getDependencyArtifactIds(pomXmlContent),
    profileDependencies: getProfileDependencyArtifactIds(pomXmlContent),
    pluginDependencies: getPluginDependencyArtifactIds(pomXmlContent),
    parentProjectArtifactId: getParentProjectName(pomXmlContent),
    aggregatorProjectArtifactId: aggregatorProjectArtifactId,
    properties: getProperties(pomXmlContent),
    skipProject:
      normalizedOpts.graphOptions.skipProjectWithoutProjectJson &&
      !existsSync(projectJsonPath),
  };

  const moduleXmlElementArray = pomXmlContent
    ?.childNamed('modules')
    ?.childrenNamed('module');
  if (moduleXmlElementArray === undefined) {
    return;
  }

  for (const moduleXmlElement of moduleXmlElementArray) {
    const moduleRelativePath = joinPathFragments(
      projectRelativePath,
      moduleXmlElement.val.trim(),
    );
    addProjects(data, normalizedOpts, moduleRelativePath, artifactId);
  }
}

function getProjectRoot(projectAbsolutePath: string) {
  let projectRoot = normalizePath(relative(workspaceRoot, projectAbsolutePath));

  // projectRoot should not be an empty string
  if (!projectRoot) {
    projectRoot = '.';
  }

  return projectRoot;
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
    .filter((dependencyXmlElement) => {
      const groupId = dependencyXmlElement.childNamed('groupId')?.val;

      return (
        groupId !== 'org.springframework.boot' &&
        groupId !== 'io.quarkus' &&
        groupId !== 'io.micronaut'
      );
    })
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
  project: MavenProjectType,
  workspaceData: WorkspaceDataType,
) {
  let newVersion = project.version;

  //1 if version is constant return it
  if (isConstantVersion(newVersion)) {
    return newVersion;
  }

  //2 try to calculate version from project properties
  newVersion = getVersionFromProperties(newVersion, project.properties);
  if (isConstantVersion(newVersion)) {
    return newVersion;
  }

  //3 try to calculate version from parent project
  // we just calculate the part we didn't calculate in step 2
  newVersion = getVersionFromParentProject(
    newVersion,
    project.parentProjectArtifactId,
    workspaceData.projects,
  );
  if (isConstantVersion(newVersion)) {
    return newVersion;
  }

  //4 Can't calculate version, maybe contains something like ${project.parent.version}
  // call help:evaluate to get version and add warning because help:evaluate took a lot of time
  logger.warn(
    `Can't calculate version ${newVersion} of project ${project.artifactId} without using mvn help:evaluate that take a lot of time. Please Open an issue to address this case.`,
  );

  return getExpressionValue(
    'project.version',
    workspaceData.mavenRootDirAbsolutePath,
    project.artifactId,
  );
}

function getVersionFromParentProject(
  newVersion: string,
  parentProjectArtifactId: string | undefined,
  projects: WorkspaceDataType['projects'],
) {
  if (!parentProjectArtifactId) {
    return newVersion;
  }

  const parentProject = projects[parentProjectArtifactId];
  newVersion = getVersionFromProperties(newVersion, parentProject.properties);

  if (isConstantVersion(newVersion)) {
    return newVersion;
  }

  return getVersionFromParentProject(
    newVersion,
    parentProject.parentProjectArtifactId,
    projects,
  );
}

export function validateTargetInputs(
  targetName: string,
  file: 'nx.json' | 'project.json',
  inputs: (string | InputDefinition)[] | undefined,
) {
  if (
    (inputs ?? []).some(
      (element: InputDefinition | string) =>
        typeof element === 'string' &&
        element === '{options.outputDirLocalRepo}',
    )
  ) {
    throw new Error(
      `"{options.outputDirLocalRepo}" is not allowed in target inputs. To make it works, remove it from "${targetName}" target in "${file}" file. If you have a valid use case, please open an issue.`,
    );
  }
}

function getTargetDefaults() {
  const targetDefaults = [];
  const nxJsonPath = join(workspaceRoot, 'nx.json');

  const nxJson = readJsonFile<NxJsonConfiguration>(nxJsonPath);
  if (nxJson.targetDefaults) {
    for (const [targetName, target] of Object.entries(nxJson.targetDefaults)) {
      validateTargetInputs(targetName, 'nx.json', target.inputs);

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

function isConstantVersion(version: string): boolean {
  const index = version.indexOf('${');

  if (index >= 0) {
    return false;
  }

  return true;
}

function getProperties(pomXmlContent: XmlDocument) {
  //properties
  const propertiesXml = pomXmlContent.childNamed('properties');

  const properties: PropertyType[] = [];

  if (propertiesXml === undefined) {
    return properties;
  }

  propertiesXml.eachChild((propertyXml) => {
    properties.push({ key: propertyXml.name, value: propertyXml.val });
  });

  return properties;
}

function getVersionFromProperties(version: string, properties: PropertyType[]) {
  if (properties.length === 0) {
    return version;
  }

  const versionExpressions = extractExpressions(version);

  if (versionExpressions.length === 0) {
    throw new Error(`Version ${version} is a constant`);
  }

  const commonProperties = properties.filter((p) =>
    versionExpressions.includes(p.key),
  );

  if (commonProperties.length === 0) {
    return version;
  }

  let parsedVersion = version;
  for (const property of commonProperties) {
    parsedVersion = parsedVersion.replace(
      '${' + property.key + '}',
      property.value,
    );
  }

  if (version === parsedVersion) {
    throw new Error(
      `Code not working properly: version ${version} and parsedVersion ${parsedVersion} should not be the same`,
    );
  }

  return parsedVersion;
}

function extractExpressions(version: string): string[] {
  const expressionRegex = /\${([^${}]*)}/g;
  const expressions = [];
  let match;

  while ((match = expressionRegex.exec(version)) !== null) {
    expressions.push(match[1]);
  }

  const containsAnExpression = expressions.some((p) => p.indexOf('$') >= 0);
  if (containsAnExpression) {
    throw new Error(
      `Version ${version} not correctly parsed with regex ${expressionRegex}`,
    );
  }

  return expressions;
}

function getProfileDependencyArtifactIds(pomXml: XmlDocument) {
  let results: (string | undefined)[] = [];

  const profilesXml = pomXml.childNamed('profiles');
  if (profilesXml === undefined) {
    return [];
  }

  const profileXmlArray = profilesXml.childrenNamed('profile');

  for (const profileXml of profileXmlArray) {
    const dependenciesXml = profileXml.childNamed('dependencies');
    if (dependenciesXml === undefined) {
      continue;
    }

    const profileDependencyArtifactIds = dependenciesXml
      .childrenNamed('dependency')
      .map((dependencyXmlElement) => {
        return dependencyXmlElement.childNamed('artifactId')?.val;
      });

    results = results.concat(profileDependencyArtifactIds);
  }

  return results;
}

function getPluginDependencyArtifactIds(pomXml: XmlDocument) {
  let results: (string | undefined)[] = [];

  const buildXml = pomXml.childNamed('build');
  if (buildXml === undefined) {
    return [];
  }

  results = results.concat(
    getPluginDependencyArtifactIdsFromPluginsTag(buildXml),
  );

  const pluginManagementXml = buildXml.childNamed('pluginManagement');

  if (pluginManagementXml === undefined) {
    return results;
  }

  results = results.concat(
    getPluginDependencyArtifactIdsFromPluginsTag(pluginManagementXml),
  );

  return results;
}

function getPluginDependencyArtifactIdsFromPluginsTag(xmlElement: XmlElement) {
  let results: (string | undefined)[] = [];

  const pluginsXml = xmlElement.childNamed('plugins');
  if (pluginsXml === undefined) {
    return [];
  }

  const pluginXmlArray = pluginsXml.childrenNamed('plugin');

  for (const profileXml of pluginXmlArray) {
    const dependenciesXml = profileXml.childNamed('dependencies');
    if (dependenciesXml === undefined) {
      continue;
    }

    const pluginDependencyArtifactIds = dependenciesXml
      .childrenNamed('dependency')
      .map((dependencyXmlElement) => {
        return dependencyXmlElement.childNamed('artifactId')?.val;
      });

    results = results.concat(pluginDependencyArtifactIds);
  }

  return results;
}

export function getOutputDirLocalRepo(
  localRepositoryPath: string,
  groupId: string,
  artifactId: string,
  projectVersion: string,
) {
  return join(
    localRepositoryPath,
    `${groupId.replace(
      new RegExp(/\./, 'g'),
      '/',
    )}/${artifactId}/${projectVersion}`,
  );
}

export function getTask(isRootProject: boolean) {
  if (isRootProject) {
    return 'install -N';
  }

  return 'install';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ifOutputDirLocalRepoNotPresent(options: any): boolean {
  if (!options) {
    return true;
  }

  if ('outputDirLocalRepo' in options) {
    return false;
  }

  return true;
}
