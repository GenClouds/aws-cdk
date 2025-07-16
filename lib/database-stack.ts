import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  directAccessIp?: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbEndpoint: string;
  public readonly dbPort: string;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const environment = this.node.tryGetContext('environment') || 'prod';

    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MICRO
    );

    // Create a security group for the database
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: true,
    });

    // Add inbound rule for PostgreSQL (port 5432) from VPC CIDR
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC'
    );

    const instance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15
      }),
      instanceType: instanceType,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      allocatedStorage: 25,
      maxAllocatedStorage: 25,
      credentials: rds.Credentials.fromGeneratedSecret('postgresadmin'),
      multiAz: false,
      publiclyAccessible: true, // Enable public accessibility for direct access
      storageType: rds.StorageType.GP2,
      securityGroups: [dbSecurityGroup],
      instanceIdentifier: environment === 'dev' ? 'dev-db-carecapture-ai' : 'databasestack',
      // removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Store the endpoint and port for other stacks to use
    this.dbEndpoint = instance.instanceEndpoint.hostname;
    this.dbPort = instance.instanceEndpoint.port.toString();
    this.dbSecurityGroup = dbSecurityGroup;

    // Store database credentials in SSM Parameter Store
    new ssm.StringParameter(this, 'DBEndpoint', {
      parameterName: environment === 'dev' ? `/database/${environment}/endpoint` : '/database/endpoint',
      stringValue: this.dbEndpoint,
    });

    new ssm.StringParameter(this, 'DBPort', {
      parameterName: environment === 'dev' ? `/database/${environment}/port` : '/database/port',
      stringValue: this.dbPort,
    });

    const secretArn = instance.secret?.secretArn;
    if (secretArn) {
      new ssm.StringParameter(this, 'DBSecretArn', {
        parameterName: environment === 'dev' ? `/database/${environment}/secret-arn` : '/database/secret-arn',
        stringValue: secretArn,
      });
    }
  }
}