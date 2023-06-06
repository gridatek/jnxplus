import {
  checkstyleVersion,
  ktlintVersion,
  quarkusKotlinVersion,
  quarkusPlatformVersion,
  updateNxJson,
  jnxplusGradlePluginVersion,
} from '@jnxplus/common';
import {
  addOrUpdateGitattributes,
  addOrUpdatePrettierIgnore,
  updateGitIgnore,
} from '@jnxplus/gradle';
import { Tree, formatFiles, generateFiles, offsetFromRoot } from '@nx/devkit';
import * as path from 'path';
import { NxQuarkusGradleGeneratorSchema } from './schema';

interface NormalizedSchema extends NxQuarkusGradleGeneratorSchema {
  quarkusPluginVersion: string;
  quarkusPlatformVersion: string;
  kotlinJvmVersion: string;
  kotlinPluginAllopenVersion: string;
  kotlinExtension: string;
  checkstyleVersion: string;
  ktlintVersion: string;
  jnxplusGradlePluginVersion: string;
  generateRepositories: boolean;
}

function normalizeOptions(
  tree: Tree,
  options: NxQuarkusGradleGeneratorSchema
): NormalizedSchema {
  const kotlinExtension = options.dsl === 'kotlin' ? '.kts' : '';

  const generateRepositories = process.env['NODE_ENV'] === 'test';

  return {
    ...options,
    kotlinExtension,
    quarkusPluginVersion: quarkusPlatformVersion,
    quarkusPlatformVersion,
    kotlinJvmVersion: quarkusKotlinVersion,
    kotlinPluginAllopenVersion: quarkusKotlinVersion,
    checkstyleVersion,
    ktlintVersion,
    jnxplusGradlePluginVersion,
    generateRepositories,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    offsetFromRoot: offsetFromRoot(tree.root),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'gradle', 'wrapper'),
    '',
    templateOptions
  );
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'gradle', 'config'),
    '',
    templateOptions
  );
  generateFiles(
    tree,
    path.join(__dirname, 'files', 'linters'),
    'tools/linters',
    templateOptions
  );
}

export default async function (
  tree: Tree,
  options: NxQuarkusGradleGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  addFiles(tree, normalizedOptions);
  updateNxJson(tree, '@jnxplus/nx-quarkus-gradle');
  updateGitIgnore(tree);
  addOrUpdatePrettierIgnore(tree);
  addOrUpdateGitattributes(tree);
  tree.changePermissions('gradlew', '755');
  tree.changePermissions('gradlew.bat', '755');
  await formatFiles(tree);
}
