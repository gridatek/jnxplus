import { DependencyManagementType } from '@jnxplus/common';

export interface NxMavenInitGeneratorSchema {
  javaVersion: string | number;
  dependencyManagement: DependencyManagementType;
  aggregatorProjectGroupId: string;
  aggregatorProjectName: string;
  aggregatorProjectVersion: string;
  mavenRootDirectory: string;
  skipWrapper?: boolean;
  localRepoRelativePath: string;
  skipFormat?: boolean;
  formatter?: 'none' | 'prettier';
  buildTargetName: string;
}
