#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcrStack } from '../lib/ecr-stack';
import { AppRunnerStack } from '../lib/apprunner-stack';
import { CacheStack } from '../lib/cache-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'prod';
const branch = app.node.tryGetContext('branch') || 'main';

// Keep prod names unchanged, only add Dev suffix for development
const stackSuffix = environment === 'dev' ? 'Dev' : '';

const vpcStack = new VpcStack(app, `VpcStack${stackSuffix}`, {
  tags: {
    Environment: environment,
    Branch: branch
  }
});

// Only create database stack for production (main branch)
let databaseStack: DatabaseStack | undefined;
if (branch === 'main') {
  databaseStack = new DatabaseStack(app, `DatabaseStack${stackSuffix}`, { 
    vpc: vpcStack.vpc,
    tags: {
      Environment: environment,
      Branch: branch
    }
  });
}

const ecrStack = new EcrStack(app, `EcrStack${stackSuffix}`, {
  tags: {
    Environment: environment,
    Branch: branch
  }
});

const cacheStack = new CacheStack(app, `CacheStack${stackSuffix}`, {
  vpc: vpcStack.vpc,
  tags: {
    Environment: environment,
    Branch: branch
  }
});

new AppRunnerStack(app, `AppRunnerStack${stackSuffix}`, {
  nodejsRepo: ecrStack.nodejsRepo,
  fastapiRepo: ecrStack.fastapiRepo,
  vpc: vpcStack.vpc,
  tags: {
    Environment: environment,
    Branch: branch
  }
});