#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcrStack } from '../lib/ecr-stack';
import { AppRunnerStack } from '../lib/apprunner-stack';
import { CacheStack } from '../lib/cache-stack';
import { CloudFrontStack } from '../lib/cloudfront-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'prod';
const branch = app.node.tryGetContext('branch') || 'main';

// Environment-specific stack naming - keep prod names unchanged
const stackSuffix = environment === 'dev' ? 'Dev' : '';

const vpcStack = new VpcStack(app, environment === 'dev' ? 'VpcStackDev' : 'VpcStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environment,
    Branch: branch
  }
});

const ecrStack = new EcrStack(app, environment === 'dev' ? 'EcrStackDev' : 'EcrStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environment,
    Branch: branch
  }
});

const cacheStack = new CacheStack(app, environment === 'dev' ? 'CacheStackDev' : 'CacheStack', {
  vpc: vpcStack.vpc,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environment,
    Branch: branch
  }
});

// Create database stack for both environments
const databaseStack = new DatabaseStack(app, environment === 'dev' ? 'DatabaseStackDev' : 'DatabaseStack', { 
  vpc: vpcStack.vpc,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environment,
    Branch: branch
  }
});

const appRunnerStack = new AppRunnerStack(app, environment === 'dev' ? 'AppRunnerStackDev' : 'AppRunnerStack', {
  nodejsRepo: ecrStack.nodejsRepo,
  fastapiRepo: ecrStack.fastapiRepo,
  vpc: vpcStack.vpc,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environment,
    Branch: branch
  }
});

// Create CloudFront stack for both environments
const cloudFrontStack = new CloudFrontStack(app, environment === 'dev' ? 'CloudFrontStackDev' : 'CloudFrontStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: environment,
    Branch: branch
  }
});

// Add explicit dependency on AppRunner stack
cloudFrontStack.addDependency(appRunnerStack);