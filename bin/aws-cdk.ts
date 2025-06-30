#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcrStack } from '../lib/ecr-stack';
import { AppRunnerStack } from '../lib/apprunner-stack';
import { ElasticacheStack } from '../lib/elasticache-stack';

const app = new cdk.App();

// Dev stacks with tags
const vpcStack = new VpcStack(app, 'VpcStack-dev', {
  tags: { Environment: 'dev', Project: 'microservices-deployment' }
});
const ecrStack = new EcrStack(app, 'EcrStack-dev', {
  tags: { Environment: 'dev', Project: 'microservices-deployment' }
});
const appRunnerStack = new AppRunnerStack(app, 'AppRunnerStack-dev', {
  nodejsRepo: ecrStack.nodejsRepo,
  fastapiRepo: ecrStack.fastapiRepo,
  tags: { Environment: 'dev', Project: 'microservices-deployment' }
});

// Add ElastiCache stack
new ElasticacheStack(app, 'ElasticacheStack-dev', {
  vpc: vpcStack.vpc,
  appRunnerRole: appRunnerStack.instanceRole,
  tags: { Environment: 'dev', Project: 'microservices-deployment' }
});

// Add dependencies
appRunnerStack.addDependency(ecrStack);

