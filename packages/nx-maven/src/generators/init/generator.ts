import {
  getPluginVersion,
  micronautVersion,
  prettier2VersionRegex,
  prettierPluginJavaVersion,
  prettierPluginXmlVersion,
  prettierVersion,
  prettierrcNameOptions,
  quarkusVersion,
  springBootVersion,
} from '@jnxplus/common';
import {
  ProjectConfiguration,
  Tree,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  logger,
  offsetFromRoot,
  updateJson,
  writeJson,
} from '@nx/devkit';
import * as path from 'path';
import { NxMavenInitGeneratorSchema } from './schema';

interface NormalizedSchema extends NxMavenInitGeneratorSchema {
  dot: string;
  springBootVersion: string;
  quarkusVersion: string;
  micronautVersion: string;
}

function normalizeOptions(
  tree: Tree,
  options: NxMavenInitGeneratorSchema,
): NormalizedSchema {
  const dot = '.';

  return {
    ...options,
    dot,
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

export default initGenerator;

export async function initGenerator(
  tree: Tree,
  options: NxMavenInitGeneratorSchema,
) {
  const nxMavenVersion = getPluginVersion(__dirname);
  logger.info(`Using version v${nxMavenVersion} of nx-maven`);

  const normalizedOptions = normalizeOptions(tree, options);

  if (options.mavenRootDirectory) {
    const projectConfiguration: ProjectConfiguration = {
      root: normalizedOptions.mavenRootDirectory,
      targets: {
        build: {
          executor: '@jnxplus/nx-maven:run-task',
          outputs: ['{options.outputDirLocalRepo}'],
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
  updateGitIgnore(tree, normalizedOptions);
  addPrettierToPackageJson(tree);
  addOrUpdatePrettierRc(tree);
  addOrUpdatePrettierIgnore(tree, normalizedOptions);
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

  return () => {
    installPackagesTask(tree);
  };
}

function updateNxJson(tree: Tree, options: NormalizedSchema) {
  let pluginOptions = {};

  if (options.mavenRootDirectory) {
    pluginOptions = {
      ...pluginOptions,
      mavenRootDirectory: options.mavenRootDirectory,
    };
  }

  if (options.localRepoRelativePath) {
    pluginOptions = {
      ...pluginOptions,
      localRepoRelativePath: options.localRepoRelativePath,
    };
  }

  let plugin: string | object;
  if (pluginOptions) {
    plugin = {
      plugin: '@jnxplus/nx-maven',
      options: pluginOptions,
    };
  } else {
    plugin = '@jnxplus/nx-maven';
  }

  updateJson(tree, 'nx.json', (nxJson) => {
    // if plugins is undefined, set it to an empty array
    nxJson.plugins = nxJson.plugins ?? [];
    // add plugin
    nxJson.plugins.push(plugin);
    // return modified JSON object
    return nxJson;
  });
}

function updateGitIgnore(tree: Tree, options: NormalizedSchema) {
  const filePath = '.gitignore';
  const contents = tree.read(filePath, 'utf-8') ?? '';

  const mavenIgnores = [
    '\n',
    '\n# Maven',
    '\ntarget/',
    '\n!**/src/main/**/target/',
    '\n!**/src/test/**/target/',
  ];

  if (!options.skipWrapper) {
    mavenIgnores.push('\n!.mvn/wrapper/maven-wrapper.jar');
  }

  if (options.localRepoRelativePath) {
    if (options.mavenRootDirectory) {
      mavenIgnores.push(
        `\n${options.mavenRootDirectory}/${options.localRepoRelativePath}`,
      );
    } else {
      mavenIgnores.push(`\n${options.localRepoRelativePath}`);
    }
  }

  const newContents = contents.concat(mavenIgnores.join(''));
  tree.write(filePath, newContents);
}

function addPrettierToPackageJson(tree: Tree) {
  updateJson(tree, 'package.json', (packageJson) => {
    packageJson.devDependencies = packageJson.devDependencies ?? {};

    if (!packageJson.devDependencies['prettier']) {
      packageJson.devDependencies['prettier'] = prettierVersion;
    } else {
      const prettierV = packageJson.devDependencies['prettier'];

      if (prettierV.match(prettier2VersionRegex)) {
        packageJson.devDependencies['prettier'] = prettierVersion;
      }
    }

    if (!packageJson.devDependencies['@prettier/plugin-xml']) {
      packageJson.devDependencies['@prettier/plugin-xml'] =
        prettierPluginXmlVersion;
    }

    if (!packageJson.devDependencies['prettier-plugin-java']) {
      packageJson.devDependencies['prettier-plugin-java'] =
        prettierPluginJavaVersion;
    }
    return packageJson;
  });
}

function addOrUpdatePrettierRc(tree: Tree) {
  const prettierRcPath = '.prettierrc';
  if (tree.exists(prettierRcPath)) {
    updateJson(tree, prettierRcPath, (prettierRcJson) => {
      prettierRcJson.xmlWhitespaceSensitivity = 'ignore';
      prettierRcJson.plugins = prettierRcJson.plugins ?? [];
      if (!prettierRcJson.plugins.includes('@prettier/plugin-xml')) {
        prettierRcJson.plugins.push('@prettier/plugin-xml');
      }
      if (!prettierRcJson.plugins.includes('prettier-plugin-java')) {
        prettierRcJson.plugins.push('prettier-plugin-java');
      }
      // return modified JSON object
      return prettierRcJson;
    });
  } else if (prettierrcNameOptions.every((name) => !tree.exists(name))) {
    writeJson(tree, prettierRcPath, {
      xmlWhitespaceSensitivity: 'ignore',
      plugins: ['@prettier/plugin-xml', 'prettier-plugin-java'],
    });
  } else {
    logger.warn(
      'Please add xmlWhitespaceSensitivity with ignore value, @prettier/plugin-xml and prettier-plugin-java plugins to your prettier config file',
    );
  }
}

function addOrUpdatePrettierIgnore(tree: Tree, options: NormalizedSchema) {
  const prettierIgnorePath = '.prettierignore';
  const mavenPrettierIgnores = ['# Maven target', '\ntarget/'];

  if (options.localRepoRelativePath) {
    if (options.mavenRootDirectory) {
      mavenPrettierIgnores.push(
        `\n${options.mavenRootDirectory}/${options.localRepoRelativePath}`,
      );
    } else {
      mavenPrettierIgnores.push(`\n${options.localRepoRelativePath}`);
    }
  }

  if (tree.exists(prettierIgnorePath)) {
    const prettierIgnoreOldContent =
      tree.read(prettierIgnorePath, 'utf-8') ?? '';
    mavenPrettierIgnores.unshift('\n\n');

    const prettierIgnoreContent = prettierIgnoreOldContent.concat(
      mavenPrettierIgnores.join(''),
    );
    tree.write(prettierIgnorePath, prettierIgnoreContent);
  } else {
    tree.write(prettierIgnorePath, mavenPrettierIgnores.join(''));
  }
}

function addOrUpdateGitattributes(tree: Tree) {
  const gitattributesPath = '.gitattributes';
  const attributes = [
    '#',
    '\n# https://help.github.com/articles/dealing-with-line-endings/',
    '\n#',
    '\n# Linux start script should use lf',
    '\nmvnw text eol=lf',
    '\n# Windows script files should use crlf',
    '\nmvnw.cmd text eol=crlf',
  ];

  if (tree.exists(gitattributesPath)) {
    const gitattributesOldContent = tree.read(gitattributesPath, 'utf-8') ?? '';
    attributes.unshift('\n\n');

    const gitattributesContent = gitattributesOldContent.concat(
      attributes.join(''),
    );
    tree.write(gitattributesPath, gitattributesContent);
  } else {
    tree.write(gitattributesPath, attributes.join(''));
  }
}
