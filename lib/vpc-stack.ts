import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'VpcStack-Dev', {
      vpcName: 'VpcStack-Dev',
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'IsolatedSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Override route table names
    const privateRouteTable = this.vpc.privateSubnets[0].routeTable;
    cdk.Tags.of(privateRouteTable).add('Name', 'VpcStack-Dev/Rt/PrivateSubnet1');
    
    const isolatedRouteTable = this.vpc.isolatedSubnets[0].routeTable;
    cdk.Tags.of(isolatedRouteTable).add('Name', 'VpcStack-Dev/Rt/IsolatedSubnet1');
  }
}
