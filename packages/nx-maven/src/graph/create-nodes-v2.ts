import { NxMavenPluginOptions, TargetsType } from '@jnxplus/common';
import {
  CreateNodesContextV2,
  createNodesFromFiles,
  CreateNodesV2,
  ProjectConfiguration,
  readJsonFile,
} from '@nx/devkit';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  getEffectiveVersion,
  getOutputDirLocalRepo,
  getTask,
  getWorkspaceData,
  ifOutputDirLocalRepoNotPresent,
  validateTargetInputs,
  WorkspaceDataType,
} from './graph-utils';

export const createNodesV2: CreateNodesV2<NxMavenPluginOptions> = [
  'nx.json',
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        createNodesInternal(configFile, options, context),
      configFiles,
      options,
      context,
    );
  },
];

async function createNodesInternal(
  configFilePath: string,
  options: NxMavenPluginOptions | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: CreateNodesContextV2,
) {
  const workspaceData: WorkspaceDataType = await getWorkspaceData(options);
  const mavenProjects = workspaceData.projects;

  const projects: Record<string, ProjectConfiguration> = {};

  for (const project of Object.values(mavenProjects)) {
    if (project.skipProject) {
      continue;
    }

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
        const target = targets[targetName];
        validateTargetInputs(targetName, 'project.json', target.inputs);

        if (
          ifOutputDirLocalRepoNotPresent(target?.options) &&
          (workspaceData.targetDefaults.includes(targetName) ||
            (target.outputs ?? []).some(
              (element: string) => element === '{options.outputDirLocalRepo}',
            ))
        ) {
          const effectiveVersion = getEffectiveVersion(project, workspaceData);

          const outputDirLocalRepo = getOutputDirLocalRepo(
            workspaceData.localRepo,
            project.groupId,
            project.artifactId,
            effectiveVersion,
          );

          target.options = {
            ...target.options,
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

      const buildTargetName = options?.buildTargetName
        ? options.buildTargetName
        : 'build';

      targets = {
        [buildTargetName]: {
          executor: '@jnxplus/nx-maven:run-task',
          outputs: outputs,
          options: {
            task: getTask(project.isRootProject),
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
}
