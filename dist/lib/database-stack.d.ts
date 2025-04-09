import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
interface DatabaseStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}
export declare class DatabaseStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: DatabaseStackProps);
}
export {};
