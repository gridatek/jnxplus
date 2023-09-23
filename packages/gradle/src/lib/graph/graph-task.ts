import { getProjectGraphNodeType } from '@jnxplus/common';
import {
  FileData,
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
  joinPathFragments,
  logger,
  workspaceRoot,
} from '@nx/devkit';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { projectGraphCacheDirectory } from 'nx/src/utils/cache-directory';
import * as path from 'path';
import { getExecutable } from '../utils';

type GradleProject1Type = {
  name: string;
  //TODO: projectDirPath should be removed and use relativePath instead for better compatibility
  projectDirPath: string;
  isProjectJsonExists: boolean;
  isBuildGradleExists: boolean;
};

type GradleProject2Type = {
  isBuildGradleKtsExists: boolean;
  isSettingsGradleExists: boolean;
  isSettingsGradleKtsExists: boolean;
  isGradlePropertiesExists: boolean;
  parentProjectName: string;
  dependencies: GradleProject1Type[];
  relativePath?: string;
};

type GradleProjectType = GradleProject1Type & GradleProject2Type;

export function addProjectsAndDependenciesFromTask(
  builder: ProjectGraphBuilder,
  context: ProjectGraphProcessorContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pluginName: string,
) {
  const isVerbose = process.env['NX_VERBOSE_LOGGING'] === 'true';
  const outputFile = path.join(
    projectGraphCacheDirectory,
    `nx-gradle-deps.json`,
  );

  let command = `${getExecutable()} :projectDependencyTask --outputFile=${outputFile}`;

  if (isVerbose) {
    command += ' --stacktrace';
  }

  execSync(command, {
    cwd: workspaceRoot,
    stdio: isVerbose ? 'inherit' : 'pipe',
    env: process.env,
    encoding: 'utf-8',
  });

  const projects: GradleProjectType[] = JSON.parse(
    fs.readFileSync(outputFile, 'utf8'),
  );

  addProjects(builder, context, projects);

  addDependencies(builder, projects);
}

function addProjects(
  builder: ProjectGraphBuilder,
  context: ProjectGraphProcessorContext,
  projects: GradleProjectType[],
) {
  for (const project of projects) {
    if (
      project.isBuildGradleExists ||
      project.isBuildGradleKtsExists ||
      project.isSettingsGradleExists ||
      project.isSettingsGradleKtsExists
    ) {
      if (!project.isProjectJsonExists) {
        let projectRoot;
        if (project.relativePath) {
          projectRoot = joinPathFragments(project.relativePath);
        } else {
          projectRoot = path.relative(workspaceRoot, project.projectDirPath);
        }

        const projectGraphNodeType = getProjectGraphNodeType(projectRoot);

        builder.addNode({
          name: project.name,
          type: projectGraphNodeType,
          data: {
            root: projectRoot,
            projectType:
              projectGraphNodeType === 'app' ? 'application' : 'library',
            targets: {
              build: {
                executor: 'nx:noop',
              },
            },
          },
        });

        const files: FileData[] = [];

        if (project.isSettingsGradleExists) {
          const file = joinPathFragments(projectRoot, 'settings.gradle');
          files.push({
            file: file,
            hash: 'abc',
          });
        }

        if (project.isSettingsGradleKtsExists) {
          const file = joinPathFragments(projectRoot, 'settings.gradle.kts');
          files.push({
            file: file,
            hash: 'abc',
          });
        }

        if (project.isBuildGradleExists) {
          const file = joinPathFragments(projectRoot, 'build.gradle');
          files.push({
            file: file,
            hash: 'abc',
          });
        }

        if (project.isBuildGradleKtsExists) {
          const file = joinPathFragments(projectRoot, 'build.gradle.kts');
          files.push({
            file: file,
            hash: 'abc',
          });
        }

        if (project.isGradlePropertiesExists) {
          const file = joinPathFragments(projectRoot, 'gradle.properties');
          files.push({
            file: file,
            hash: 'abc',
          });
        }

        context.fileMap[project.name] = files;
      }
    }
  }
}

function addDependencies(
  builder: ProjectGraphBuilder,
  projects: GradleProjectType[],
) {
  for (const project of projects) {
    if (project.isBuildGradleExists || project.isBuildGradleKtsExists) {
      const projectName = getProjectName(project);

      const buildFile = project.isBuildGradleExists
        ? 'build.gradle'
        : 'build.gradle.kts';

      let projectSourceFile;
      if (project.relativePath) {
        projectSourceFile = joinPathFragments(project.relativePath, buildFile);
      } else {
        const projectRoot = path.relative(
          workspaceRoot,
          project.projectDirPath,
        );
        projectSourceFile = joinPathFragments(projectRoot, buildFile);
      }

      const isVerbose = process.env['NX_VERBOSE_LOGGING'] === 'true';
      if (isVerbose) {
        logger.debug(`workspaceRoot: ${workspaceRoot}`);
        logger.debug(`projectDirPath: ${project.projectDirPath}`);
        logger.debug(`relativePath: ${project.relativePath}`);
        logger.debug(`projectSourceFile: ${projectSourceFile}`);
      }

      const parentProject = getParentProject(
        projects,
        project.parentProjectName,
      );
      if (parentProject) {
        const parentProjectName = getProjectName(parentProject);

        builder.addStaticDependency(
          projectName,
          parentProjectName,
          projectSourceFile,
        );
      }

      for (const dependency of project.dependencies) {
        const dependencyName = getProjectName(dependency);

        builder.addStaticDependency(
          projectName,
          dependencyName,
          projectSourceFile,
        );
      }
    }
  }
}

function getProjectName(project: GradleProject1Type) {
  if (project.isProjectJsonExists) {
    const projectJsonPath = path.join(project.projectDirPath, 'project.json');
    const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
    return projectJson.name;
  }

  return project.name;
}

function getParentProject(
  projects: GradleProjectType[],
  parentProjectName: string,
): GradleProjectType | undefined {
  const project = projects.find(
    (element) => element.name === parentProjectName,
  );

  if (!project) {
    return undefined;
  }

  if (
    project.isBuildGradleExists ||
    project.isBuildGradleKtsExists ||
    project.isSettingsGradleExists ||
    project.isSettingsGradleKtsExists
  ) {
    return project;
  }

  return getParentProject(projects, project.parentProjectName);
}
