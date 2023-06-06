import { addProjectsAndDependenciesFromTask } from '@jnxplus/gradle';
import {
  ProjectGraph,
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
} from '@nx/devkit';

export function processProjectGraph(
  graph: ProjectGraph,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: ProjectGraphProcessorContext
): ProjectGraph {
  const builder = new ProjectGraphBuilder(graph);
  addProjectsAndDependenciesFromTask(builder, '@jnxplus/nx-quarkus-gradle');
  return builder.getUpdatedProjectGraph();
}
