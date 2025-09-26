import {
  CreateDependencies,
  CreateDependenciesContext,
  DependencyType,
  joinPathFragments,
  RawProjectGraphDependency,
  validateDependency,
} from '@nx/devkit';
import {
  getNormalizedOptions,
  getWorkspaceData,
  MavenProjectType,
  WorkspaceDataType,
} from './graph-utils';
import { NxMavenPluginOptions } from '@jnxplus/common';

export const createDependencies: CreateDependencies<
  NxMavenPluginOptions
> = async (opts, context: CreateDependenciesContext) => {
  const results: RawProjectGraphDependency[] = [];
  const normalizedOpts = getNormalizedOptions(opts);

  const workspaceData: WorkspaceDataType = await getWorkspaceData(opts);
  const projects = workspaceData.projects;

  for (const project of Object.values(projects)) {
    if (!project.skipProject) {
      const projectSourceFile = joinPathFragments(
        project.projectRoot,
        'pom.xml',
      );

      if (project.parentProjectArtifactId) {
        const parentProject = projects[project.parentProjectArtifactId];

        if (!parentProject.skipProject) {
          const newDependency = {
            source: project.artifactId,
            target: parentProject.artifactId,
            sourceFile: projectSourceFile,
            type: DependencyType.static,
          };

          validateDependency(newDependency, context);
          results.push(newDependency);
        }
      }

      if (!normalizedOpts.graphOptions.skipAggregatorProjectLinking) {
        if (
          project.aggregatorProjectArtifactId &&
          project.aggregatorProjectArtifactId !==
            project.parentProjectArtifactId
        ) {
          const aggregatorProject =
            projects[project.aggregatorProjectArtifactId];

          if (!aggregatorProject.skipProject) {
            const newDependency = {
              source: project.artifactId,
              target: aggregatorProject.artifactId,
              sourceFile: projectSourceFile,
              type: DependencyType.static,
            };

            validateDependency(newDependency, context);
            results.push(newDependency);
          }
        }
      }

      const dependencies = getDependencyProjects(project, projects);
      for (const dependency of dependencies) {
        if (!dependency.skipProject) {
          const newDependency = {
            source: project.artifactId,
            target: dependency.artifactId,
            sourceFile: projectSourceFile,
            type: DependencyType.static,
          };

          validateDependency(newDependency, context);
          results.push(newDependency);
        }
      }

      const profileDependencies = getProfileDependencyProjects(
        project,
        projects,
      );
      for (const profileDependency of profileDependencies) {
        if (!profileDependency.skipProject) {
          const newDependency = {
            source: project.artifactId,
            target: profileDependency.artifactId,
            sourceFile: projectSourceFile,
            type: DependencyType.static,
          };

          validateDependency(newDependency, context);
          results.push(newDependency);
        }
      }

      const pluginDependencies = getPluginDependencyProjects(project, projects);
      for (const pluginDependency of pluginDependencies) {
        if (!pluginDependency.skipProject) {
          const newDependency = {
            source: project.artifactId,
            target: pluginDependency.artifactId,
            sourceFile: projectSourceFile,
            type: DependencyType.static,
          };

          validateDependency(newDependency, context);
          results.push(newDependency);
        }
      }
    }
  }

  return results;
};

function getDependencyProjects(
  project: MavenProjectType,
  projects: WorkspaceDataType['projects'],
) {
  return Object.values(projects).filter((p) =>
    project.dependencies.includes(p.artifactId),
  );
}

function getProfileDependencyProjects(
  project: MavenProjectType,
  projects: WorkspaceDataType['projects'],
) {
  return Object.values(projects).filter((p) =>
    project.profileDependencies.includes(p.artifactId),
  );
}

function getPluginDependencyProjects(
  project: MavenProjectType,
  projects: WorkspaceDataType['projects'],
) {
  return Object.values(projects).filter((p) =>
    project.pluginDependencies.includes(p.artifactId),
  );
}
