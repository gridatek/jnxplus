import {
  MavenPluginType,
  generatePackageDirectory,
  generatePackageName,
  generateParsedProjects,
  generateParsedTags,
  generateProjectDirectory,
  generateProjectName,
  generateProjectRoot,
  generateSimpleProjectName,
  micronautVersion,
  quarkusVersion,
  springBootVersion,
} from '@jnxplus/common';
import { readXmlTree } from '@jnxplus/xml';
import {
  ProjectConfiguration,
  Tree,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  offsetFromRoot,
  readProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';
import {
  addLibraryToProjects,
  addMissedProperties,
  addProjectToAggregator,
  getArtifactId,
  getGroupId,
  getMavenRootDirectory,
  getVersion,
} from '../../utils';
import { NxMavenLibGeneratorSchema } from './schema';

export default async function (tree: Tree, options: NxMavenLibGeneratorSchema) {
  await libraryGenerator(__dirname, '@jnxplus/nx-maven', tree, options);
}

interface NormalizedSchema extends NxMavenLibGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  packageName: string;
  packageDirectory: string;
  parsedProjects: string[];
  parentGroupId: string;
  parentProjectName: string;
  parentProjectVersion: string;
  relativePath: string;
  parentProjectRoot: string;
  springBootVersion: string;
  quarkusVersion: string;
  micronautVersion: string;
  plugin: MavenPluginType;
  mavenRootDirectory: string;
}

function normalizeOptions(
  plugin: MavenPluginType,
  tree: Tree,
  options: NxMavenLibGeneratorSchema,
): NormalizedSchema {
  const simpleProjectName = generateSimpleProjectName({
    name: options.name,
  });

  const projectName = generateProjectName(simpleProjectName, {
    name: options.name,
    simpleName: options.simpleName,
    directory: options.directory,
  });

  const projectDirectory = generateProjectDirectory(simpleProjectName, {
    directory: options.directory,
  });

  const mavenRootDirectory = getMavenRootDirectory();
  const projectRoot = generateProjectRoot(mavenRootDirectory, projectDirectory);

  const parsedTags = generateParsedTags({ tags: options.tags });

  const packageName = generatePackageName(simpleProjectName, {
    simplePackageName: options.simplePackageName,
    groupId: options.groupId,
    directory: options.directory,
  });

  const packageDirectory = generatePackageDirectory(packageName);

  const parsedProjects = generateParsedProjects({ projects: options.projects });

  const rootPomXmlContent = readXmlTree(
    tree,
    path.join(mavenRootDirectory, 'pom.xml'),
  );
  const rootParentProjectName = getArtifactId(rootPomXmlContent);

  const parentProjectRoot =
    options.parentProject && options.parentProject !== rootParentProjectName
      ? readProjectConfiguration(tree, options.parentProject).root
      : mavenRootDirectory
        ? mavenRootDirectory
        : '';

  const parentProjectPomPath = path.join(parentProjectRoot, 'pom.xml');

  const pomXmlContent = readXmlTree(tree, parentProjectPomPath);
  const relativePath = joinPathFragments(
    path.relative(projectRoot, parentProjectRoot),
    'pom.xml',
  );

  const parentProjectName = getArtifactId(pomXmlContent);
  const parentGroupId = getGroupId(parentProjectName, pomXmlContent);
  const parentProjectVersion = getVersion(parentProjectName, pomXmlContent);

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    packageName,
    packageDirectory,
    parsedProjects,
    parentGroupId,
    parentProjectName,
    parentProjectVersion,
    relativePath,
    parentProjectRoot,
    springBootVersion,
    quarkusVersion,
    micronautVersion,
    plugin,
    mavenRootDirectory,
  };
}

function addBootFiles(d: string, tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(d, 'files', 'boot', options.language),
    options.projectRoot,
    templateOptions,
  );

  if (options.skipStarterCode) {
    const fileExtension = options.language === 'java' ? 'java' : 'kt';
    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/main/${options.language}/${options.packageDirectory}/HelloService.${fileExtension}`,
      ),
    );

    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/test/${options.language}/${options.packageDirectory}/HelloServiceTests.${fileExtension}`,
      ),
    );

    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/test/${options.language}/${options.packageDirectory}/TestConfiguration.${fileExtension}`,
      ),
    );

    if (options.language === 'kotlin') {
      tree.delete(
        joinPathFragments(
          options.projectRoot,
          `/src/test/resources/junit-platform.properties`,
        ),
      );
    }
  }
}

function addQuarkusFiles(d: string, tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(d, 'files', 'quarkus', options.language),
    options.projectRoot,
    templateOptions,
  );

  if (options.skipStarterCode) {
    const fileExtension = options.language === 'java' ? 'java' : 'kt';
    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/main/${options.language}/${options.packageDirectory}/GreetingService.${fileExtension}`,
      ),
    );

    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/test/${options.language}/${options.packageDirectory}/GreetingServiceTest.${fileExtension}`,
      ),
    );
  } else {
    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/main/${options.language}/.gitkeep`,
      ),
    );

    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/test/${options.language}/.gitkeep`,
      ),
    );
  }
}

function addMicronautFiles(d: string, tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(d, 'files', 'micronaut', options.language),
    options.projectRoot,
    templateOptions,
  );

  if (options.skipStarterCode) {
    const fileExtension = options.language === 'java' ? 'java' : 'kt';
    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/main/${options.language}/${options.packageDirectory}/HelloService.${fileExtension}`,
      ),
    );

    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/test/${options.language}/${options.packageDirectory}/HelloServiceTest.${fileExtension}`,
      ),
    );
  } else {
    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/main/${options.language}/.gitkeep`,
      ),
    );

    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/test/${options.language}/.gitkeep`,
      ),
    );
  }
}

function addNoneFiles(d: string, tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(d, 'files', 'none', options.language),
    options.projectRoot,
    templateOptions,
  );

  if (options.skipStarterCode) {
    const fileExtension = options.language === 'java' ? 'java' : 'kt';
    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/main/${options.language}/${options.packageDirectory}/Library.${fileExtension}`,
      ),
    );

    tree.delete(
      joinPathFragments(
        options.projectRoot,
        `/src/test/${options.language}/${options.packageDirectory}/LibraryTest.${fileExtension}`,
      ),
    );
  }
}

function addFiles(
  d: string,
  plugin: MavenPluginType,
  tree: Tree,
  options: NormalizedSchema,
) {
  if (options.framework === 'spring-boot') {
    addBootFiles(d, tree, options);
  }

  if (options.framework === 'quarkus') {
    addQuarkusFiles(d, tree, options);
  }

  if (options.framework === 'micronaut') {
    addMicronautFiles(d, tree, options);
  }

  if (options.framework === 'none') {
    addNoneFiles(d, tree, options);
  }
}

async function libraryGenerator(
  d: string,
  plugin: MavenPluginType,
  tree: Tree,
  options: NxMavenLibGeneratorSchema,
) {
  const normalizedOptions = normalizeOptions(plugin, tree, options);

  addMissedProperties(tree, {
    framework: options.framework,
    springBootVersion: springBootVersion,
    quarkusVersion: quarkusVersion,
    micronautVersion: micronautVersion,
    mavenRootDirectory: normalizedOptions.mavenRootDirectory,
  });

  const projectConfiguration: ProjectConfiguration = {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
    sourceRoot: `./${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: `${plugin}:run-task`,
        outputs: ['{projectRoot}/target', '{options.outputDirLocalRepo}'],
        options: {
          task: 'install -DskipTests=true',
        },
      },
      test: {
        executor: `${plugin}:run-task`,
        options: {
          task: 'test',
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  };

  addProjectConfiguration(
    tree,
    normalizedOptions.projectName,
    projectConfiguration,
  );

  addFiles(d, plugin, tree, normalizedOptions);
  addProjectToAggregator(tree, {
    projectRoot: normalizedOptions.projectRoot,
    aggregatorProject: normalizedOptions.aggregatorProject,
    mavenRootDirectory: normalizedOptions.mavenRootDirectory,
  });
  addLibraryToProjects(tree, normalizedOptions);
  await formatFiles(tree);
}
