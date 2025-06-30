#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcrStack } from '../lib/ecr-stack';
import { AppRunnerStack } from '../lib/apprunner-stack';
import { ElasticacheStack } from '../lib/elasticache-stack';

const app = new cdk.App();

// Existing stacks
const vpcStack = new VpcStack(app, 'VpcStack-dev');
const databaseStack = new DatabaseStack(app, 'DatabaseStack-dev', { vpc: vpcStack.vpc });
const ecrStack = new EcrStack(app, 'EcrStack-dev');
const appRunnerStack = new AppRunnerStack(app, 'AppRunnerStack-dev', {
  nodejsRepo: ecrStack.nodejsRepo,
  fastapiRepo: ecrStack.fastapiRepo,
});

// Add ElastiCache stack
new ElasticacheStack(app, 'ElasticacheStack-dev', {
  vpc: vpcStack.vpc,
  appRunnerRole: appRunnerStack.instanceRole,
});

// Add dependencies
databaseStack.addDependency(vpcStack);
appRunnerStack.addDependency(ecrStack);

