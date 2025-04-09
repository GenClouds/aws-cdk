import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
interface AppRunnerStackProps extends cdk.StackProps {
    nodejsRepo: ecr.Repository;
    fastapiRepo: ecr.Repository;
}
export declare class AppRunnerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: AppRunnerStackProps);
}
export {};
