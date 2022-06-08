import { ExecutorContext, logger } from '@nrwl/devkit';
import { getExecutable, runCommand, waitForever } from '../../utils/command';
import { ServeExecutorSchema } from './schema';

export default async function runExecutor(
  options: ServeExecutorSchema,
  context: ExecutorContext
) {
  logger.info(`Executor ran for serve: ${JSON.stringify(options)}`);
  const result = runCommand(
    `${getExecutable()} spring-boot:run -pl :${context.projectName} ${
      options.args
    }`
  );

  if (!result.success) {
    return { success: false };
  }

  await waitForever();
  return { success: true };
}
