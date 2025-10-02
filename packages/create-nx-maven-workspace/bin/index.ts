#!/usr/bin/env node

import { createWorkspace } from 'create-nx-workspace';
import { prompt } from 'enquirer';
import * as yargs from 'yargs';
import { DependencyManagementType } from '@jnxplus/common';

async function main() {
  let name = process.argv[2];
  if (!name) {
    name = (
      await prompt<{ name: string }>({
        type: 'input',
        name: 'name',
        message: 'What is the name of the workspace?',
      })
    ).name;
  }

  const args = yargs.argv;

  let javaVersion = args['javaVersion'];
  if (!javaVersion) {
    javaVersion = (
      await prompt<{ javaVersion: 'none' | '17' | '21' | '25' }>({
        name: 'javaVersion',
        message: 'Which version of Java would you like to use?',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial: 'none' as any,
        type: 'autocomplete',
        choices: [
          { name: 'none', message: 'None - Set version later' },
          { name: '17', message: '17' },
          { name: '21', message: '21' },
          { name: '25', message: '25' },
        ],
      })
    ).javaVersion;
  }

  let aggregatorProjectGroupId = args['aggregatorProjectGroupId'];
  if (!aggregatorProjectGroupId) {
    aggregatorProjectGroupId = (
      await prompt<{ aggregatorProjectGroupId: string }>({
        type: 'input',
        name: 'aggregatorProjectGroupId',
        message:
          'What groupId would you like to use for root aggregator project?',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial: 'com.example' as any,
      })
    ).aggregatorProjectGroupId;
  }

  let aggregatorProjectName = args['aggregatorProjectName'];
  if (!aggregatorProjectName) {
    aggregatorProjectName = (
      await prompt<{ aggregatorProjectName: string }>({
        type: 'input',
        name: 'aggregatorProjectName',
        message: 'What name would you like to use for root aggregator project?',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial: 'root-aggregator-project' as any,
      })
    ).aggregatorProjectName;
  }

  let aggregatorProjectVersion = args['aggregatorProjectVersion'];
  if (!aggregatorProjectVersion) {
    aggregatorProjectVersion = (
      await prompt<{ aggregatorProjectVersion: string }>({
        type: 'input',
        name: 'aggregatorProjectVersion',
        message:
          'What version would you like to use for root aggregator project?',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial: '0.0.1-SNAPSHOT' as any,
      })
    ).aggregatorProjectVersion;
  }

  let dependencyManagement = args['dependencyManagement'];
  if (!dependencyManagement) {
    dependencyManagement = (
      await prompt<{
        dependencyManagement: DependencyManagementType;
      }>({
        name: 'dependencyManagement',
        message: 'Which dependency management strategy would you like to use?',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial: 'none' as any,
        type: 'autocomplete',
        choices: [
          {
            name: 'none',
            message: 'None - Configure manually later',
          },
          {
            name: 'spring-boot-parent-pom',
            message: 'Spring Boot Parent POM',
          },
          {
            name: 'spring-boot-bom',
            message: 'Spring Boot BOM (Bill of Materials)',
          },
          {
            name: 'quarkus-bom',
            message: 'Quarkus BOM (Bill of Materials)',
          },
          {
            name: 'micronaut-parent-pom',
            message: 'Micronaut Parent POM',
          },
          {
            name: 'micronaut-bom',
            message: 'Micronaut BOM (Bill of Materials)',
          },
        ],
      })
    ).dependencyManagement;
  }

  console.log(`Creating the workspace: ${name}`);

  // This assumes "@jnxplus/nx-maven" and "create-nx-maven-workspace" are at the same version

  const presetVersion = require('../package.json').version;

  console.log(`Using version v${presetVersion} of nx-maven`);

  const { directory } = await createWorkspace(
    `@jnxplus/nx-maven@${presetVersion}`,
    {
      name,
      nxCloud: 'skip',
      packageManager: 'npm',
      //init generator
      javaVersion,
      dependencyManagement,
      aggregatorProjectGroupId,
      aggregatorProjectName,
      aggregatorProjectVersion,
      mavenRootDirectory: args['mavenRootDirectory'] ?? '',
      skipWrapper: false,
      localRepoRelativePath: args['localRepoRelativePath'] ?? '.m2/repository',
      buildTargetName: args['buildTargetName'] ?? 'build',
    },
  );

  console.log(`Successfully created the workspace: ${directory}.`);
}

main();
