import { ProjectType } from '@jnxplus/common';

export interface NxQuarkusMavenParentProjectGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  simpleName?: boolean;
  projectType: ProjectType;
  groupId: string;
  projectVersion: string;
  parentProject?: string;
  aggregatorProject?: string;
}
