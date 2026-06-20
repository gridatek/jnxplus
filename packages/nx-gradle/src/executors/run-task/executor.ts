import { getTargetName, runCommand } from '@jnxplus/common';
import { ExecutorContext, logger, workspaceRoot } from '@nx/devkit';
import { join } from 'path';
import {
  getExecutable,
  getGradleRootDirectory,
  getProjectPath,
} from '../../utils';
import { RunTaskExecutorSchema } from './schema';

export default async function runExecutor(
  options: RunTaskExecutorSchema,
  context: ExecutorContext,
) {
  const targetName = getTargetName(context);
  logger.info(`Executor ran for ${targetName}: ${JSON.stringify(options)}`);

  const gradleRootDirectory = getGradleRootDirectory();
  const gradleRootDirectoryAbsolutePath = join(
    workspaceRoot,
    gradleRootDirectory,
  );

  let projectPath: string;
  if (options.projectPath) {
    projectPath = options.projectPath;
  } else {
    projectPath = getProjectPath(context, gradleRootDirectoryAbsolutePath);
  }

  let task: string;
  if (Array.isArray(options.task)) {
    task = options.task.join(' ');
  } else {
    task = options.task;
  }

  const command = `${getExecutable()} ${projectPath}:${task}`;

  return runCommand(command, gradleRootDirectoryAbsolutePath);
}
