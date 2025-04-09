import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends cdk.Stack {
  public readonly nodejsRepo: ecr.Repository;
  public readonly fastapiRepo: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.nodejsRepo = new ecr.Repository(this, 'NodejsRepo', {
      repositoryName: 'nodejs-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });

    this.fastapiRepo = new ecr.Repository(this, 'FastAPIRepo', {
      repositoryName: 'fastapi-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });
  }
}
