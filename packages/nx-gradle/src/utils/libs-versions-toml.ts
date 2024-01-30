import {
  PresetType,
  VersionManagementType,
  jnxplusGradlePluginVersion,
  kotlinVersion,
  kspVersion,
  micronautPlatformCatalog,
  micronautVersion,
  quarkusVersion,
  shadowVersion,
  springBootVersion,
  springDependencyManagementVersion,
} from '@jnxplus/common';
import { Tree, joinPathFragments } from '@nx/devkit';

const regex1 = /\[versions]/;
const regex2 = /\[libraries]/;
const regex3 = /\[plugins]/;

const regex = /plugins\s*{/;

interface ElementsType {
  versions: string[];
  libraries: string[];
  plugins: string[];
}

export function addLibsVersionsToml(
  tree: Tree,
  gradleRootDirectory: string,
  javaVersion: string | number,
  preset: PresetType,
  language: string,
) {
  const libsVersionsTomlPath = joinPathFragments(
    gradleRootDirectory,
    'gradle',
    'libs.versions.toml',
  );

  const libsVersionsTomlContent = getLibsVersionsTomlContent(
    javaVersion,
    preset,
    language,
  );

  if (!tree.exists(libsVersionsTomlPath)) {
    tree.write(libsVersionsTomlPath, libsVersionsTomlContent);
  }
}

function getLibsVersionsTomlContent(
  javaVersion: string | number,
  preset: PresetType | undefined,
  language: string,
) {
  const elements: ElementsType = getElements(javaVersion, preset, language);

  return `[versions]\n${elements.versions.join(
    '\n',
  )}\n\n[libraries]\n${elements.libraries.join(
    '\n',
  )}\n\n[plugins]\n${elements.plugins.join('\n')}`;
}

function getElements(
  javaVersion: string | number,
  preset: PresetType | undefined,
  language: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalog?: any,
) {
  const elements: ElementsType = { versions: [], libraries: [], plugins: [] };

  if (!catalog?.versions['java']) {
    elements.versions.push(`java = "${javaVersion}"`);
  }

  if (!catalog?.plugins['github-khalilou88-jnxplus']) {
    elements.plugins.push(
      `github-khalilou88-jnxplus = { id = "io.github.khalilou88.jnxplus", version = "${jnxplusGradlePluginVersion}" }`,
    );
  }

  if (language === 'kotlin') {
    if (!catalog?.versions['kotlin']) {
      elements.versions.push(`kotlin = "${kotlinVersion}"`);
    }

    if (!catalog?.plugins['jetbrains-kotlin-jvm']) {
      elements.plugins.push(
        'jetbrains-kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }',
      );
    }
  }

  if (preset === 'spring-boot') {
    if (!catalog?.versions['spring-boot']) {
      elements.versions.push(`spring-boot = "${springBootVersion}"`);
    }

    if (!catalog?.plugins['springframework-boot']) {
      elements.plugins.push(
        'springframework-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }',
      );
    }

    if (!catalog?.plugins['spring-dependency-management']) {
      elements.plugins.push(
        `spring-dependency-management = { id = "io.spring.dependency-management", version = "${springDependencyManagementVersion}" }`,
      );
    }

    if (
      language === 'kotlin' &&
      !catalog?.plugins['jetbrains-kotlin-plugin-spring']
    ) {
      elements.plugins.push(
        'jetbrains-kotlin-plugin-spring = { id = "org.jetbrains.kotlin.plugin.spring", version.ref = "kotlin" }',
      );
    }
  }

  if (preset === 'quarkus') {
    if (!catalog?.versions['quarkus']) {
      elements.versions.push(`quarkus = "${quarkusVersion}"`);
    }

    if (!catalog?.libraries['quarkus-platform-quarkus-bom']) {
      elements.libraries.push(
        'quarkus-platform-quarkus-bom = { module = "io.quarkus.platform:quarkus-bom", version.ref = "quarkus" }',
      );
    }

    if (
      language === 'kotlin' &&
      !catalog?.plugins['jetbrains-kotlin-plugin-allopen']
    ) {
      elements.plugins.push(
        'jetbrains-kotlin-plugin-allopen = { id = "org.jetbrains.kotlin.plugin.allopen", version.ref = "kotlin" }',
      );
    }

    if (!catalog?.plugins['quarkus']) {
      elements.plugins.push(
        'quarkus = { id = "io.quarkus", version.ref = "quarkus" }',
      );
    }
  }

  if (preset === 'micronaut') {
    if (!catalog?.versions['micronaut']) {
      elements.versions.push(`micronaut = "${micronautVersion}"`);
    }

    if (
      language === 'kotlin' &&
      !catalog?.plugins['jetbrains-kotlin-plugin-allopen']
    ) {
      elements.plugins.push(
        'jetbrains-kotlin-plugin-allopen = { id = "org.jetbrains.kotlin.plugin.allopen", version.ref = "kotlin" }',
      );
    }

    if (!catalog?.plugins['micronaut-aot']) {
      elements.plugins.push(
        'micronaut-aot = { id = "io.micronaut.aot", version = "4.2.1" }',
      );
    }

    if (!catalog?.plugins['micronaut-application']) {
      elements.plugins.push(
        'micronaut-application = { id = "io.micronaut.application", version = "4.2.1" }',
      );
    }

    if (!catalog?.plugins['micronaut-library']) {
      elements.plugins.push(
        'micronaut-library = { id = "io.micronaut.library", version = "4.2.1" }',
      );
    }

    if (!catalog?.plugins['google-devtools-ksp']) {
      elements.plugins.push(
        `google-devtools-ksp = { id = "com.google.devtools.ksp", version = "${kspVersion}" }`,
      );
    }

    if (!catalog?.plugins['github-johnrengelman-shadow']) {
      elements.plugins.push(
        `github-johnrengelman-shadow = { id = "com.github.johnrengelman.shadow", version = "${shadowVersion}" }`,
      );
    }
  }

  return elements;
}

export async function addMissingCode(
  tree: Tree,
  versionManagement: VersionManagementType,
  gradleRootDirectory: string,
  framework: PresetType | undefined,
  language: string,
) {
  if (versionManagement !== 'version-catalog') {
    return;
  }

  const { parse } = await (Function("return import('smol-toml')")() as Promise<
    typeof import('smol-toml')
  >);

  const libsVersionsTomlPath = joinPathFragments(
    gradleRootDirectory,
    'gradle',
    'libs.versions.toml',
  );

  const libsVersionsTomlContent =
    tree.read(libsVersionsTomlPath, 'utf-8') || '';
  const catalog = parse(libsVersionsTomlContent);

  const elements: ElementsType = getElements(
    '17',
    framework,
    language,
    catalog,
  );

  updateLibsVersionsToml(
    tree,
    libsVersionsTomlPath,
    libsVersionsTomlContent,
    elements,
  );

  updateBuildGradle(tree, gradleRootDirectory, elements.plugins);

  updateSettingsGradle(tree, gradleRootDirectory, framework);
}

function updateLibsVersionsToml(
  tree: Tree,
  libsVersionsTomlPath: string,
  libsVersionsTomlContent: string,
  elements: ElementsType,
) {
  let fileChanged = false;
  let newLibsVersionsTomlContent1;
  if (elements.versions.length > 0) {
    newLibsVersionsTomlContent1 = libsVersionsTomlContent.replace(
      regex1,
      `[versions]\n${elements.versions.join('\n')}`,
    );
    fileChanged = true;
  } else {
    newLibsVersionsTomlContent1 = libsVersionsTomlContent;
  }

  let newLibsVersionsTomlContent2;
  if (elements.libraries.length > 0) {
    newLibsVersionsTomlContent2 = newLibsVersionsTomlContent1.replace(
      regex2,
      `[libraries]\n${elements.libraries.join('\n')}`,
    );
    fileChanged = true;
  } else {
    newLibsVersionsTomlContent2 = newLibsVersionsTomlContent1;
  }

  let newLibsVersionsTomlContent;
  if (elements.plugins.length > 0) {
    newLibsVersionsTomlContent = newLibsVersionsTomlContent2.replace(
      regex3,
      `[plugins]\n${elements.plugins.join('\n')}`,
    );
    fileChanged = true;
  } else {
    newLibsVersionsTomlContent = newLibsVersionsTomlContent2;
  }

  if (fileChanged) {
    tree.write(libsVersionsTomlPath, newLibsVersionsTomlContent);
  }
}

function updateBuildGradle(
  tree: Tree,
  gradleRootDirectory: string,
  plugins: string[],
) {
  if (plugins.length > 0) {
    const buildGradlePath = joinPathFragments(
      gradleRootDirectory,
      'build.gradle',
    );
    const buildGradleKtsPath = joinPathFragments(
      gradleRootDirectory,
      'build.gradle.kts',
    );

    const pluginAlias = plugins.map(
      (p) =>
        `libs.plugins.${p.split('=')[0].trim().replace(new RegExp(/-/, 'g'), '.')}`,
    );

    if (tree.exists(buildGradlePath)) {
      const buildGradleContent = tree.read(buildGradlePath, 'utf-8') || '';

      const plugins = pluginAlias.map((alias) => `alias ${alias} apply false`);

      const newBuildGradleContent = buildGradleContent.replace(
        regex,
        `plugins {\n${plugins.join('\n')}`,
      );
      tree.write(buildGradlePath, newBuildGradleContent);
    }

    if (tree.exists(buildGradleKtsPath)) {
      const buildGradleKtsContent =
        tree.read(buildGradleKtsPath, 'utf-8') || '';

      const plugins = pluginAlias.map((alias) => `alias(${alias}) apply false`);

      const newBuildGradleKtsContent = buildGradleKtsContent.replace(
        regex,
        `plugins {\n${plugins.join('\n')}`,
      );
      tree.write(buildGradleKtsPath, newBuildGradleKtsContent);
    }
  }
}

function updateSettingsGradle(
  tree: Tree,
  gradleRootDirectory: string,
  framework: PresetType | undefined,
) {
  if (framework === 'micronaut') {
    const settingsGradlePath = joinPathFragments(
      gradleRootDirectory,
      'settings.gradle',
    );
    const settingsGradleKtsPath = joinPathFragments(
      gradleRootDirectory,
      'settings.gradle.kts',
    );

    if (tree.exists(settingsGradlePath)) {
      const settingsGradleContent =
        tree.read(settingsGradlePath, 'utf-8') || '';

      const plugins = parsePluginIds(settingsGradleContent);

      if (plugins.includes('io.micronaut.platform.catalog')) {
        return;
      }

      let newSettingsGradleContent;
      if (plugins.length === 0) {
        newSettingsGradleContent = settingsGradleContent.replace(
          regex,
          `plugins {\n\tid 'io.micronaut.platform.catalog' version '${micronautPlatformCatalog}'\n}`,
        );
      } else {
        newSettingsGradleContent = settingsGradleContent.replace(
          regex,
          `plugins {\n\tid 'io.micronaut.platform.catalog' version '${micronautPlatformCatalog}'\n`,
        );
      }

      tree.write(settingsGradlePath, newSettingsGradleContent);
    }

    if (tree.exists(settingsGradleKtsPath)) {
      const settingsGradleKtsContent =
        tree.read(settingsGradleKtsPath, 'utf-8') || '';

      const plugins = parsePluginIds(settingsGradleKtsContent);

      if (plugins.includes('io.micronaut.platform.catalog')) {
        return;
      }

      let newSettingsGradleKtsContent;
      if (plugins.length === 0) {
        newSettingsGradleKtsContent = settingsGradleKtsContent.replace(
          regex,
          `plugins {\n\tid("io.micronaut.platform.catalog") version "${micronautPlatformCatalog}"\n}`,
        );
      } else {
        newSettingsGradleKtsContent = settingsGradleKtsContent.replace(
          regex,
          `plugins {\n\tid("io.micronaut.platform.catalog") version "${micronautPlatformCatalog}"\n`,
        );
      }

      tree.write(settingsGradleKtsPath, newSettingsGradleKtsContent);
    }
  }
}

function parsePluginIds(newSettingsGradle: string): string[] {
  const pluginIdsRegex = /id\s*\(*['"]([^'"]+)['"]/g;
  const pluginIds = [];
  let match;

  while ((match = pluginIdsRegex.exec(newSettingsGradle)) !== null) {
    pluginIds.push(match[1]);
  }

  return pluginIds;
}
