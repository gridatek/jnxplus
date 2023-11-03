import { checkstyleVersion, downloadFile, getBuildTool } from '@jnxplus/common';
import { readXml } from '@jnxplus/xml';
import { workspaceRoot } from '@nx/devkit';
import * as fs from 'fs';
import { readNxJson } from 'nx/src/config/configuration';
import * as path from 'path';

function readCheckstyleVersion(gradlePropertiesContent: string) {
  const regexp = /checkstyleVersion=(.*)/g;
  const matches = (gradlePropertiesContent.match(regexp) || []).map((e) =>
    e.replace(regexp, '$1'),
  );
  return matches[0];
}

function getCheckstyleVersionMaven(dir: string) {
  const parentPomXmlPath = path.join(dir, 'pom.xml');

  let checkstyleVersionXml = undefined;
  if (fs.existsSync(parentPomXmlPath)) {
    const parentPomXmlContent = readXml(parentPomXmlPath);
    checkstyleVersionXml = parentPomXmlContent
      .childNamed('properties')
      ?.childNamed('checkstyle.version');
  }

  return checkstyleVersionXml === undefined
    ? checkstyleVersion
    : checkstyleVersionXml.val;
}

function getCheckstyleVersionGradle(dir: string) {
  const gradlePropertiesPath = path.join(dir, 'gradle.properties');
  let version = undefined;
  if (fs.existsSync(gradlePropertiesPath)) {
    const gradlePropertiesContent = fs.readFileSync(
      gradlePropertiesPath,
      'utf-8',
    );
    version = readCheckstyleVersion(gradlePropertiesContent);
  }
  return version === undefined ? checkstyleVersion : version;
}

function getCheckstyleVersion(dir: string) {
  if (getBuildTool() === '@jnxplus/nx-gradle') {
    return getCheckstyleVersionGradle(dir);
  } else {
    return getCheckstyleVersionMaven(dir);
  }
}

export async function getCheckstylePath(dir = workspaceRoot) {
  const version = getCheckstyleVersion(dir);

  const checkstyleJarName = `checkstyle-${version}-all.jar`;
  const downloadUrl = `https://github.com/checkstyle/checkstyle/releases/download/checkstyle-${version}/${checkstyleJarName}`;

  let outputDirectory;
  const nxJson = readNxJson();
  if (nxJson.installation) {
    outputDirectory = path.join(
      dir,
      '.nx',
      'installation',
      'node_modules',
      '@jnxplus',
      'checkstyle',
    );
  } else {
    outputDirectory = path.join(dir, 'node_modules', '@jnxplus', 'checkstyle');
  }

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  const checkstyleJarAbsolutePath = path.join(
    outputDirectory,
    checkstyleJarName,
  );

  if (!fs.existsSync(checkstyleJarAbsolutePath)) {
    await downloadFile(downloadUrl, checkstyleJarAbsolutePath);
  }
  return checkstyleJarAbsolutePath;
}
