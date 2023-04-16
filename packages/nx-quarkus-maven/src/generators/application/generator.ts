import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import { XmlDocument } from 'xmldoc';
import { normalizeName } from '../../utils/command';
import { LinterType } from '../../utils/types';
import { readXmlTree, xmlToString } from '../../utils/xml';
import { NxQuarkusMavenAppGeneratorSchema } from './schema';

interface NormalizedSchema extends NxQuarkusMavenAppGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  appClassName: string;
  packageName: string;
  packageDirectory: string;
  linter: LinterType;
  parentGroupId: string;
  parentProjectName: string;
  parentProjectVersion: string;
  relativePath: string;
  quarkusVersion: string;
}

function normalizeOptions(
  tree: Tree,
  options: NxQuarkusMavenAppGeneratorSchema
): NormalizedSchema {
  const simpleProjectName = names(normalizeName(options.name)).fileName;
  const projectName = options.directory
    ? `${normalizeName(names(options.directory).fileName)}-${simpleProjectName}`
    : simpleProjectName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${simpleProjectName}`
    : simpleProjectName;
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const appClassName = `${names(projectName).className}Application`;

  const packageName2 = `${options.groupId}.${
    options.packageNameType === 'long' && options.directory
      ? `${names(options.directory).fileName.replace(
          new RegExp(/\//, 'g'),
          '.'
        )}.${names(simpleProjectName).className.toLocaleLowerCase()}`
      : names(simpleProjectName).className.toLocaleLowerCase()
  }`;

  //remove dash from packageName
  const packageName = packageName2.replace(new RegExp(/-/, 'g'), '');

  const packageDirectory = packageName.replace(new RegExp(/\./, 'g'), '/');

  const linter = options.language === 'java' ? 'checkstyle' : 'ktlint';

  const relativePath = path
    .relative(projectRoot, tree.root)
    .replace(new RegExp(/\\/, 'g'), '/');

  const pomXmlContent = readXmlTree(tree, 'pom.xml');
  const parentGroupId = pomXmlContent.childNamed('groupId').val;
  const parentProjectName = pomXmlContent.childNamed('artifactId').val;
  const parentProjectVersion = pomXmlContent.childNamed('version').val;

  const quarkusVersion = pomXmlContent
    .childNamed('properties')
    .childNamed('quarkus.platform.version').val;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    appClassName,
    packageName,
    packageDirectory,
    linter,
    parentGroupId,
    parentProjectName,
    parentProjectVersion,
    relativePath,
    quarkusVersion,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files', options.language),
    options.projectRoot,
    templateOptions
  );
}

export default async function (
  tree: Tree,
  options: NxQuarkusMavenAppGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  if (options.language === 'java') {
    addProjectConfiguration(tree, normalizedOptions.projectName, {
      root: normalizedOptions.projectRoot,
      projectType: 'application',
      sourceRoot: `${normalizedOptions.projectRoot}/src`,
      targets: {
        build: {
          executor: '@jnxplus/nx-quarkus-maven:build',
          outputs: [`${normalizedOptions.projectRoot}/target`],
        },
        'build-image': {
          executor: '@jnxplus/nx-quarkus-maven:build-image',
        },
        serve: {
          executor: '@jnxplus/nx-quarkus-maven:serve',
          dependsOn: [
            {
              target: 'build',
              projects: 'self',
            },
          ],
        },
        lint: {
          executor: '@jnxplus/nx-quarkus-maven:lint',
          options: {
            linter: `${normalizedOptions.linter}`,
          },
        },
        test: {
          executor: '@jnxplus/nx-quarkus-maven:test',
          dependsOn: [
            {
              target: 'build',
              projects: 'self',
            },
          ],
        },
        'integration-test': {
          executor: '@jnxplus/nx-quarkus-maven:integration-test',
          dependsOn: [
            {
              target: 'build',
              projects: 'self',
            },
          ],
        },
      },
      tags: normalizedOptions.parsedTags,
    });
  } else {
    addProjectConfiguration(tree, normalizedOptions.projectName, {
      root: normalizedOptions.projectRoot,
      projectType: 'application',
      sourceRoot: `${normalizedOptions.projectRoot}/src`,
      targets: {
        build: {
          executor: '@jnxplus/nx-quarkus-maven:build',
          outputs: [`${normalizedOptions.projectRoot}/target`],
        },
        'build-image': {
          executor: '@jnxplus/nx-quarkus-maven:build-image',
        },
        serve: {
          executor: '@jnxplus/nx-quarkus-maven:serve',
          dependsOn: [
            {
              target: 'build',
              projects: 'self',
            },
          ],
        },
        lint: {
          executor: '@jnxplus/nx-quarkus-maven:lint',
          options: {
            linter: `${normalizedOptions.linter}`,
          },
        },
        test: {
          executor: '@jnxplus/nx-quarkus-maven:test',
          dependsOn: [
            {
              target: 'build',
              projects: 'self',
            },
          ],
        },
        'integration-test': {
          executor: '@jnxplus/nx-quarkus-maven:integration-test',
          dependsOn: [
            {
              target: 'build',
              projects: 'self',
            },
          ],
        },
        ktformat: {
          executor: '@jnxplus/nx-quarkus-maven:ktformat',
        },
      },
      tags: normalizedOptions.parsedTags,
    });
  }

  addFiles(tree, normalizedOptions);
  addProjectToParentPomXml(tree, normalizedOptions);
  await formatFiles(tree);
}

function addProjectToParentPomXml(tree: Tree, options: NormalizedSchema) {
  const filePath = `pom.xml`;
  const xmldoc = readXmlTree(tree, filePath);
  const fragment = new XmlDocument(`<module>${options.projectRoot}</module>`);
  xmldoc.childNamed('modules').children.push(fragment);
  tree.write(filePath, xmlToString(xmldoc));
}
