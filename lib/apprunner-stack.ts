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

    // Add permissions to access SSM parameters
    this.instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: ['arn:aws:ssm:*:*:parameter/database/*'],
      })
    );

    // Create Node.js App Runner Service
    new apprunner.Service(this, 'NodejsAppRunner', {
      source: apprunner.Source.fromEcr({
        imageConfiguration: {
          port: 3000,
        },
        repository: props.nodejsRepo,
        tagOrDigest: 'latest',
      }),
      instanceRole: this.instanceRole,  // Use the class property
    });

    // Create FastAPI App Runner Service
    new apprunner.Service(this, 'FastAPIAppRunner', {
      source: apprunner.Source.fromEcr({
        imageConfiguration: {
          port: 8000,
        },
        repository: props.fastapiRepo,
        tagOrDigest: 'latest',
      }),
      instanceRole: this.instanceRole,  // Use the class property
    });
  }
}
