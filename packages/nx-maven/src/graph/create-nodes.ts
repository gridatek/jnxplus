import { NxMavenPluginOptions, TargetsType } from '@jnxplus/common';
import { CreateNodes, ProjectConfiguration, readJsonFile } from '@nx/devkit';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  MavenProjectType,
  WorkspaceDataType,
  getEffectiveVersion,
  getWorkspaceData,
} from './graph-utils';

export const createNodes: CreateNodes<NxMavenPluginOptions> = [
  'nx.json',
  (_, opts) => {
    const workspaceData: WorkspaceDataType = getWorkspaceData(opts);
    const mavenProjects: MavenProjectType[] = workspaceData.projects;

    const projects: Record<string, ProjectConfiguration> = {};

    for (const project of mavenProjects) {
      let projectName;
      let targets: TargetsType = {};

      const projectJsonPath = path.join(
        project.projectAbsolutePath,
        'project.json',
      );

      if (existsSync(projectJsonPath)) {
        const projectJson = readJsonFile(projectJsonPath);
        projectName = projectJson.name;

        if (projectName !== project.artifactId) {
          throw new Error(
            `ProjectName ${projectName} and artifactId ${project.artifactId} should be the same`,
          );
        }

        targets = projectJson.targets;
        for (const [targetName] of Object.entries(targets ?? {})) {
          if (
            workspaceData.targetDefaults.includes(targetName) ||
            (targets[targetName].outputs ?? []).some(
              (element: string) => element === '{options.outputDirLocalRepo}',
            )
          ) {
            const effectiveVersion = getEffectiveVersion(
              project,
              workspaceData,
            );

            const outputDirLocalRepo = getOutputDirLocalRepo(
              workspaceData.localRepo,
              project.groupId,
              project.artifactId,
              effectiveVersion,
            );

            targets[targetName].options = {
              ...targets[targetName].options,
              outputDirLocalRepo: outputDirLocalRepo,
            };
          }
        }
      } else {
        const effectiveVersion = getEffectiveVersion(project, workspaceData);

        const outputDirLocalRepo = getOutputDirLocalRepo(
          workspaceData.localRepo,
          project.groupId,
          project.artifactId,
          effectiveVersion,
        );

        projectName = project.artifactId;
        let outputs;
        if (project.isPomPackaging) {
          outputs = ['{options.outputDirLocalRepo}'];
        } else {
          outputs = ['{projectRoot}/target', '{options.outputDirLocalRepo}'];
        }
        targets = {
          build: {
            executor: '@jnxplus/nx-maven:run-task',
            outputs: outputs,
            options: {
              task: getTask(project.isAggregatorProject),
              outputDirLocalRepo: outputDirLocalRepo,
            },
          },
        };
      }

      projects[project.projectRoot] = {
        root: project.projectRoot,
        name: projectName,
        targets: targets,
        tags: ['nx-maven'],
      };
    }

    return { projects: projects };
  },
];

function getOutputDirLocalRepo(
  localRepositoryPath: string,
  groupId: string,
  artifactId: string,
  projectVersion: string,
) {
  return path.join(
    localRepositoryPath,
    `${groupId.replace(
      new RegExp(/\./, 'g'),
      '/',
    )}/${artifactId}/${projectVersion}`,
  );
}

function getTask(isAggregatorProject: boolean) {
  if (isAggregatorProject) {
    return 'install -N';
  }

  return 'install';
}
