#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcrStack } from '../lib/ecr-stack';
import { AppRunnerStack } from '../lib/apprunner-stack';
import { ElasticacheStack } from '../lib/elasticache-stack';

const app = new cdk.App();

// Existing stacks //
const vpcStack = new VpcStack(app, 'VpcStack');
const databaseStack = new DatabaseStack(app, 'DatabaseStack', { vpc: vpcStack.vpc });
const ecrStack = new EcrStack(app, 'EcrStack');
const appRunnerStack = new AppRunnerStack(app, 'AppRunnerStack', {
  nodejsRepo: ecrStack.nodejsRepo,
  fastapiRepo: ecrStack.fastapiRepo,
});

// Add ElastiCache stack
new ElasticacheStack(app, 'ElasticacheStack', {
  vpc: vpcStack.vpc,
  appRunnerRole: appRunnerStack.instanceRole,
});

// Add dependencies
databaseStack.addDependency(vpcStack);
appRunnerStack.addDependency(ecrStack);

