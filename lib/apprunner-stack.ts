import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface AppRunnerStackProps extends cdk.StackProps {
  nodejsRepo: ecr.Repository;
  fastapiRepo: ecr.Repository;
  vpc: ec2.Vpc;
}

export class AppRunnerStack extends cdk.Stack {
  // Add public properties to access service names
  public readonly nodejsServiceName: string;
  public readonly fastapiServiceName: string;


  constructor(scope: Construct, id: string, props: AppRunnerStackProps) {
    super(scope, id, props);

    // Create IAM role for App Runner
    const instanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });

    // Add permissions to access AWS services
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'secretsmanager:GetSecretValue',
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    // Create security group for App Runner
    const appRunnerSG = new ec2.SecurityGroup(this, 'AppRunnerSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for App Runner services',
      allowAllOutbound: true,  // Allow all outbound traffic
    });

    // Allow outbound access to Redis
    appRunnerSG.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(6379),
      'Allow outbound access to Redis'
    );

    // Allow HTTPS for ECR and other AWS services
    appRunnerSG.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    // Allow HTTP for non-secure webhooks and APIs
    appRunnerSG.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound'
    );

    // Allow common webhook ports
    appRunnerSG.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcpRange(8000, 8999),
      'Allow common webhook ports'
    );

    // Get environment context
    const environment = this.node.tryGetContext('environment') || 'prod';
    const stackSuffix = environment === 'dev' ? 'Dev' : '';

    // Create VPC connector for App Runner
    const vpcConnector = new apprunner.VpcConnector(this, 'VpcConnector', {
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }),
      securityGroups: [appRunnerSG],
      vpcConnectorName: `apprunner-connector-${environment}-${this.region}`
    });

    // Create Node.js App Runner Service
    const nodejsService = new apprunner.Service(this, 'NodejsAppRunner', {
      source: apprunner.Source.fromEcr({
        imageConfiguration: {
          port: 3000,
          environmentVariables: {
            REDIS_HOST: cdk.Fn.importValue(environment === 'dev' ? 'CacheStackDev:RedisEndpoint' : 'CacheStack-endpoint'),
            REDIS_PORT: '6379',
            REDIS_TLS_DISABLED: 'true'  // Disable TLS for Redis connection
          }
        },
        repository: props.nodejsRepo,
        tagOrDigest: 'latest',
      }),
      instanceRole,
      vpcConnector
    });

    // Create FastAPI App Runner Service
    const fastapiService = new apprunner.Service(this, 'FastAPIAppRunner', {
      source: apprunner.Source.fromEcr({
        imageConfiguration: {
          port: 8000,
          environmentVariables: {
            REDIS_HOST: cdk.Fn.importValue(environment === 'dev' ? 'CacheStackDev:RedisEndpoint' : 'CacheStack-endpoint'),
            REDIS_PORT: '6379',
            REDIS_TLS_DISABLED: 'true'  // Disable TLS for Redis connection
          }
        },
        repository: props.fastapiRepo,
        tagOrDigest: 'latest',
      }),
      instanceRole,
      vpcConnector
    });

    // Store service names
    this.nodejsServiceName = nodejsService.serviceName;
    this.fastapiServiceName = fastapiService.serviceName;





    // Add outputs
    new cdk.CfnOutput(this, 'NodejsServiceName', {
      value: nodejsService.serviceName,
      description: 'The name of the Node.js App Runner service',
      exportName: environment === 'dev' ? 'NodejsAppRunnerServiceNameDev' : 'NodejsAppRunnerServiceName',
    });

    new cdk.CfnOutput(this, 'FastAPIServiceName', {
      value: fastapiService.serviceName,
      description: 'The name of the FastAPI App Runner service',
      exportName: environment === 'dev' ? 'FastAPIAppRunnerServiceNameDev' : 'FastAPIAppRunnerServiceName',
    });

    new cdk.CfnOutput(this, 'NodejsServiceUrl', {
      value: nodejsService.serviceUrl,
      description: 'The URL of the Node.js App Runner service',
      exportName: environment === 'dev' ? 'NodejsAppRunnerServiceUrlDev' : 'NodejsAppRunnerServiceUrl',
    });

    new cdk.CfnOutput(this, 'FastAPIServiceUrl', {
      value: fastapiService.serviceUrl,
      description: 'The URL of the FastAPI App Runner service',
      exportName: environment === 'dev' ? 'FastAPIAppRunnerServiceUrlDev' : 'FastAPIAppRunnerServiceUrl',
    });

    // Add VPC Connector output
    new cdk.CfnOutput(this, 'VpcConnectorArn', {
      value: vpcConnector.vpcConnectorArn,
      description: 'The ARN of the VPC Connector',
      exportName: environment === 'dev' ? 'AppRunnerVpcConnectorArnDev' : 'AppRunnerVpcConnectorArn',
    });




  }
}