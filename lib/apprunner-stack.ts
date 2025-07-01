import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import { Construct } from 'constructs';

interface AppRunnerStackProps extends cdk.StackProps {
  nodejsRepo: ecr.Repository;
  fastapiRepo: ecr.Repository;
}

export class AppRunnerStack extends cdk.Stack {
  // Add this line to expose the role to other stacks
  public readonly instanceRole: iam.Role;

  constructor(scope: Construct, id: string, props: AppRunnerStackProps) {
    super(scope, id, props);

    // Change 'const' to 'this.' to make it a class property
    this.instanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });

    // Adding permissions to access SSM parameters
    this.instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: ['arn:aws:ssm:*:*:parameter/database/*'],
      })
    );

    // Create Node.js App Runner Service
    const nodejsService = new apprunner.Service(this, 'NodejsAppRunner', {
      serviceName: 'nodejs-service-dev',
      source: apprunner.Source.fromEcr({
        imageConfiguration: {
          port: 3000,
        },
        repository: props.nodejsRepo,
        tagOrDigest: 'latest',
      }),
      instanceRole: this.instanceRole,
    });

    // Create FastAPI App Runner Service
    const fastapiService = new apprunner.Service(this, 'FastAPIAppRunner', {
      serviceName: 'fastapi-service-dev',
      source: apprunner.Source.fromEcr({
        imageConfiguration: {
          port: 8000,
        },
        repository: props.fastapiRepo,
        tagOrDigest: 'latest',
      }),
      instanceRole: this.instanceRole,
    });

    // Adding tags to AppRunner services
    cdk.Tags.of(nodejsService).add('Environment', 'dev');
    cdk.Tags.of(nodejsService).add('Service', 'nodejs');
    cdk.Tags.of(fastapiService).add('Environment', 'dev');
    cdk.Tags.of(fastapiService).add('Service', 'fastapi');
  }
}
