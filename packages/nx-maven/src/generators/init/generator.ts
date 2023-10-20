import {
  springBootVersion,
  kotlinVersion,
  quarkusVersion,
  micronautVersion,
} from '@jnxplus/common';
import {
  addOrUpdateGitattributes,
  addOrUpdatePrettierIgnore,
  addOrUpdatePrettierRc,
  updateGitIgnore,
} from '../../utils/generators';
import {
  ProjectConfiguration,
  Tree,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  joinPathFragments,
  offsetFromRoot,
  updateJson,
} from '@nx/devkit';
import * as path from 'path';
import { NxMavenGeneratorSchema } from './schema';

interface NormalizedSchema extends NxMavenGeneratorSchema {
  dot: string;
  kotlinVersion: string;
  springBootVersion: string;
  quarkusVersion: string;
  micronautVersion: string;
}

function normalizeOptions(
  tree: Tree,
  options: NxMavenGeneratorSchema,
): NormalizedSchema {
  const dot = '.';

  return {
    ...options,
    dot,
    kotlinVersion,
    springBootVersion,
    quarkusVersion,
    micronautVersion,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    offsetFromRoot: offsetFromRoot(tree.root),
    template: '',
  };
  if (!options.skipWrapper) {
    generateFiles(
      tree,
      path.join(__dirname, 'files', 'maven', 'wrapper'),
      options.mavenRootDirectory,
      templateOptions,
    );
  }
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'maven', 'config'),
    options.mavenRootDirectory,
    templateOptions,
  );
}

export default async function (tree: Tree, options: NxMavenGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  if (options.mavenRootDirectory) {
    const projectConfiguration: ProjectConfiguration = {
      root: normalizedOptions.mavenRootDirectory,
      targets: {
        build: {
          executor: '@jnxplus/nx-maven:run-task',
          options: {
            task: 'install -N',
          },
        },
      },
    };

    addProjectConfiguration(
      tree,
      normalizedOptions.parentProjectName,
      projectConfiguration,
    );
  }

  addFiles(tree, normalizedOptions);
  updateNxJson(tree, normalizedOptions);
  updateGitIgnore(tree, options.skipWrapper);
  addOrUpdatePrettierRc(tree);
  addOrUpdatePrettierIgnore(tree);
  addOrUpdateGitattributes(tree);
  if (!options.skipWrapper) {
    tree.changePermissions(
      joinPathFragments(normalizedOptions.mavenRootDirectory, 'mvnw'),
      '755',
    );
    tree.changePermissions(
      joinPathFragments(normalizedOptions.mavenRootDirectory, 'mvnw.cmd'),
      '755',
    );
  }
  await formatFiles(tree);
}

export function updateNxJson(tree: Tree, options: NormalizedSchema) {
  const plugin = {
    plugin: '@jnxplus/nx-maven',
    options: {
      mavenRootDirectory: options.mavenRootDirectory,
    },
  };

  updateJson(tree, 'nx.json', (nxJson) => {
    // if plugins is undefined, set it to an empty array
    nxJson.plugins = nxJson.plugins ?? [];
    // add plugin
    nxJson.plugins.push(plugin);
    // return modified JSON object
    return nxJson;
  });
}
