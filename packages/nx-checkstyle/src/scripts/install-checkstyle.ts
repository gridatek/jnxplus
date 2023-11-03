import { isE2eTest } from '@jnxplus/common';
import { logger, workspaceRoot } from '@nx/devkit';
import * as path from 'path';
import { getCheckstylePath } from '../lib/nx-checkstyle';

(async () => {
  if (process.env['NX_VERBOSE_LOGGING'] === 'true') {
    logger.debug('Install Checkstyle');
  }

  let workspaceRootToUse = workspaceRoot;
  const tmpWorkspaceRoot = path.join(
    workspaceRootToUse,
    'tmp',
    'nx-e2e',
    'proj',
  );

  if (isE2eTest(tmpWorkspaceRoot)) {
    workspaceRootToUse = tmpWorkspaceRoot;
  }

  await getCheckstylePath(workspaceRootToUse);
})();
