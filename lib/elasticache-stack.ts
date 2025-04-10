import * as cdk from 'aws-cdk-lib';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ElasticacheStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  appRunnerRole?: iam.IRole;
}

export class ElasticacheStack extends cdk.Stack {
  public readonly redisCluster: elasticache.CfnReplicationGroup;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ElasticacheStackProps) {
    super(scope, id, props);

    // 👇  to fix ClientToken issues
      synthesizer: new cdk.DefaultStackSynthesizer({
        generateBootstrapVersionRule: false,

    // Security Group (unchanged)
    this.securityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Redis cluster',
      allowAllOutbound: true,
      securityGroupName: 'redis-security-group',
    });

    // Subnet Group (unchanged)
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }).subnetIds,
    });

    // Parameter Group (FIXED VERSION)
    const parameterGroup = new elasticache.CfnParameterGroup(this, 'RedisParameterGroup', {
      cacheParameterGroupFamily: 'redis7',  // Changed from 'family'
      description: 'Redis parameter group',
      properties: {  // Changed from 'parameters'
        'maxmemory-policy': 'volatile-lru',
      },
    });

    // Redis Cluster (unchanged)
    this.redisCluster = new elasticache.CfnReplicationGroup(this, 'RedisCluster', {
      replicationGroupDescription: 'Redis cluster',
      engine: 'redis',
      engineVersion: '7.0',
      cacheNodeType: 'cache.t4g.small',
      numNodeGroups: 1,
      replicasPerNodeGroup: 1,
      automaticFailoverEnabled: true,
      multiAzEnabled: true,
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [this.securityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      cacheParameterGroupName: parameterGroup.ref,
    });

    // SSM Parameters (unchanged)
    new ssm.StringParameter(this, 'RedisEndpoint', {
      parameterName: '/redis/endpoint',
      stringValue: this.redisCluster.attrPrimaryEndPointAddress,
    });

    new ssm.StringParameter(this, 'RedisPort', {
      parameterName: '/redis/port',
      stringValue: this.redisCluster.attrPrimaryEndPointPort,
    });

    // App Runner role permissions (unchanged)
    if (props.appRunnerRole) {
      props.appRunnerRole.addToPrincipalPolicy(
        new iam.PolicyStatement({
          actions: ['ssm:GetParameter', 'ssm:GetParameters'],
          resources: ['arn:aws:ssm:*:*:parameter/redis/*'],
        })
      );
    }

    // Outputs (unchanged)
    new cdk.CfnOutput(this, 'RedisClusterEndpoint', {
      value: this.redisCluster.attrPrimaryEndPointAddress,
      description: 'Redis Primary Endpoint',
      exportName: 'RedisEndpoint',
    });

    new cdk.CfnOutput(this, 'RedisClusterPort', {
      value: this.redisCluster.attrPrimaryEndPointPort,
      description: 'Redis Port',
      exportName: 'RedisPort',
    });

    // Removal Policies (unchanged)
    this.redisCluster.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    subnetGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    parameterGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
  }
}
