import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MEDIUM
    );

    const cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('clusteradmin'),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      writer: rds.ClusterInstance.serverlessV2('Writer'),
      readers: [
        rds.ClusterInstance.serverlessV2('Reader1'),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 1,
    });

    // Store database credentials in SSM Parameter Store
    new ssm.StringParameter(this, 'DBEndpoint', {
      parameterName: '/database/endpoint',
      stringValue: cluster.clusterEndpoint.hostname,
    });

    new ssm.StringParameter(this, 'DBPort', {
      parameterName: '/database/port',
      stringValue: cluster.clusterEndpoint.port.toString(),
    });

    const secretArn = cluster.secret?.secretArn;
    if (secretArn) {
      new ssm.StringParameter(this, 'DBSecretArn', {
        parameterName: '/database/secret-arn',
        stringValue: secretArn,
      });
    }
  }
}
