import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import generator from './generator';
import { NxQuarkusMavenAppGeneratorSchema } from './schema';

describe('application generator', () => {
  let appTree: Tree;
  const options: NxQuarkusMavenAppGeneratorSchema = {
    name: 'test',
    language: 'java',
    groupId: 'com.example',
    packageNameType: 'long',
    projectVersion: '0.0.1-SNAPSHOT',
    configFormat: '.yml',
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
    appTree.write(
      './pom.xml',
      `<project>
        <groupId>com.example</groupId>
        <artifactId>quarkus-multi-module</artifactId>
        <version>0.0.1-SNAPSHOT</version>
        <properties>
          <kotlin.version>1.7.22</kotlin.version>
          <quarkus.platform.version>2.16.6.Final</quarkus.platform.version>
        </properties>
        <modules></modules>
      </project>`
    );
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
