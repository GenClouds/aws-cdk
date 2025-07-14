import * as cdk from 'aws-cdk-lib';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface CacheStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class CacheStack extends cdk.Stack {
  public readonly cacheEndpoint: string;
  public readonly cachePort: string;
  public readonly cacheSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const environment = this.node.tryGetContext('environment') || 'prod';

    // Create a security group for ElastiCache
    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for ElastiCache',
      allowAllOutbound: true,
      securityGroupName: environment === 'dev' ? `cache-sg-${environment}` : `${this.stackName}-cache-sg`,
    });

    // Allow inbound access from anywhere (we'll restrict this to specific IPs)
    cacheSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(6379),
      'Allow Redis access from anywhere'
    );

    // Create a subnet group
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: 'Subnet group for ElastiCache',
      subnetIds: props.vpc.publicSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: environment === 'dev' ? `cache-subnet-group-${environment}` : `${this.stackName}-subnet-group`,
    });

    // Create a parameter group for Redis
    const parameterGroup = new elasticache.CfnParameterGroup(this, 'RedisParameterGroup', {
      cacheParameterGroupFamily: 'redis7',
      description: 'Parameter group for Redis',
    });

    // Create the ElastiCache cluster with TLS disabled for now
    const cache = new elasticache.CfnCacheCluster(this, 'Cache', {
      engine: 'redis',
      cacheNodeType: 'cache.t4g.micro',
      numCacheNodes: 1,
      clusterName: environment === 'dev' ? `redis-${environment}` : `${this.stackName}-redis`,
      vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
      cacheSubnetGroupName: subnetGroup.ref,
      engineVersion: '7.0',
      port: 6379,
      autoMinorVersionUpgrade: true,
      cacheParameterGroupName: parameterGroup.ref,
      transitEncryptionEnabled: false,  // Disable TLS for now
    });

    // Add dependency to ensure subnet group and parameter group are created first
    cache.addDependsOn(subnetGroup);
    cache.addDependsOn(parameterGroup);

    // Store the endpoint and port for other stacks to use
    this.cacheEndpoint = cache.attrRedisEndpointAddress;
    this.cachePort = cache.attrRedisEndpointPort;
    this.cacheSecurityGroup = cacheSecurityGroup;

    // Create outputs
    new cdk.CfnOutput(this, 'CacheEndpoint', {
      value: this.cacheEndpoint,
      description: 'Redis endpoint address',
      exportName: `${this.stackName}-endpoint`,
    });

    new cdk.CfnOutput(this, 'CachePort', {
      value: this.cachePort,
      description: 'Redis endpoint port',
      exportName: `${this.stackName}-port`,
    });

    new cdk.CfnOutput(this, 'CacheSecurityGroupId', {
      value: cacheSecurityGroup.securityGroupId,
      description: 'Redis Security Group ID',
      exportName: `${this.stackName}-security-group-id`,
    });

    // Add a note about TLS being disabled
    new cdk.CfnOutput(this, 'RedisNote', {
      value: 'Redis is configured without TLS for development. Enable TLS in production.',
      description: 'Redis Configuration Note',
    });

    // Add tags
    const tags = this.node.tryGetContext('tags') || {};
    if (tags.project) {
      cdk.Tags.of(this).add('project', tags.project);
    }
    cdk.Tags.of(this).add('environment', environment);
  }
}