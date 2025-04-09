import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
export declare class EcrStack extends cdk.Stack {
    readonly nodejsRepo: ecr.Repository;
    readonly fastapiRepo: ecr.Repository;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
