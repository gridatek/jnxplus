import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import generator from './generator';
import { NxBootMavenAppGeneratorSchema } from './schema';

describe('application generator', () => {
  let appTree: Tree;
  const options: NxBootMavenAppGeneratorSchema = {
    name: 'test',
    language: 'java',
    groupId: 'com.example',
    projectVersion: '0.0.1-SNAPSHOT',
    packaging: 'jar',
    configFormat: '.yml',
    parentProject: '',
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
    appTree.write(
      './pom.xml',
      '<project><groupId>com.example</groupId><artifactId>boot-multi-module</artifactId><version>0.0.1-SNAPSHOT</version><modules></modules></project>'
    );
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
