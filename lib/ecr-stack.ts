import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends cdk.Stack {
  public readonly nodejsRepo: ecr.Repository;
  public readonly fastapiRepo: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = this.node.tryGetContext('environment') || 'prod';

    this.nodejsRepo = new ecr.Repository(this, 'NodejsRepo', {
      repositoryName: environment === 'dev' ? `nodejs-app-${environment}` : 'nodejs-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });

    this.fastapiRepo = new ecr.Repository(this, 'FastAPIRepo', {
      repositoryName: environment === 'dev' ? `fastapi-app-${environment}` : 'fastapi-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });
  }
}