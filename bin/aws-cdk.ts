#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcrStack } from '../lib/ecr-stack';
import { AppRunnerStack } from '../lib/apprunner-stack';
import { CacheStack } from '../lib/cache-stack';

const app = new cdk.App();

const vpcStack = new VpcStack(app, 'VpcStack');
const databaseStack = new DatabaseStack(app, 'DatabaseStack', { 
  vpc: vpcStack.vpc 
});
const ecrStack = new EcrStack(app, 'EcrStack');
const cacheStack = new CacheStack(app, 'CacheStack', {
  vpc: vpcStack.vpc
});
new AppRunnerStack(app, 'AppRunnerStack', {
  nodejsRepo: ecrStack.nodejsRepo,
  fastapiRepo: ecrStack.fastapiRepo,
  vpc: vpcStack.vpc
});
