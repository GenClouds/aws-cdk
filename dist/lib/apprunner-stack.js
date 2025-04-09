"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRunnerStack = void 0;
const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const apprunner = require("@aws-cdk/aws-apprunner-alpha");
class AppRunnerStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create IAM role for App Runner
        const instanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
            assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
        });
        // Add permissions to access SSM parameters
        instanceRole.addToPolicy(new iam.PolicyStatement({
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: ['arn:aws:ssm:*:*:parameter/database/*'],
        }));
        // Create Node.js App Runner Service
        new apprunner.Service(this, 'NodejsAppRunner', {
            source: apprunner.Source.fromEcr({
                imageConfiguration: {
                    port: 3000,
                },
                repository: props.nodejsRepo,
                tagOrDigest: 'latest',
            }),
            instanceRole,
        });
        // Create FastAPI App Runner Service
        new apprunner.Service(this, 'FastAPIAppRunner', {
            source: apprunner.Source.fromEcr({
                imageConfiguration: {
                    port: 8000,
                },
                repository: props.fastapiRepo,
                tagOrDigest: 'latest',
            }),
            instanceRole,
        });
    }
}
exports.AppRunnerStack = AppRunnerStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwcnVubmVyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2FwcHJ1bm5lci1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsMkNBQTJDO0FBRTNDLDBEQUEwRDtBQVExRCxNQUFhLGNBQWUsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMzQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTBCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGlDQUFpQztRQUNqQyxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQy9ELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQywrQkFBK0IsQ0FBQztTQUNyRSxDQUFDLENBQUM7UUFFSCwyQ0FBMkM7UUFDM0MsWUFBWSxDQUFDLFdBQVcsQ0FDdEIsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3RCLE9BQU8sRUFBRSxDQUFDLGtCQUFrQixFQUFFLG1CQUFtQixDQUFDO1lBQ2xELFNBQVMsRUFBRSxDQUFDLHNDQUFzQyxDQUFDO1NBQ3BELENBQUMsQ0FDSCxDQUFDO1FBRUYsb0NBQW9DO1FBQ3BDLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDN0MsTUFBTSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO2dCQUMvQixrQkFBa0IsRUFBRTtvQkFDbEIsSUFBSSxFQUFFLElBQUk7aUJBQ1g7Z0JBQ0QsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO2dCQUM1QixXQUFXLEVBQUUsUUFBUTthQUN0QixDQUFDO1lBQ0YsWUFBWTtTQUNiLENBQUMsQ0FBQztRQUVILG9DQUFvQztRQUNwQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzlDLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztnQkFDL0Isa0JBQWtCLEVBQUU7b0JBQ2xCLElBQUksRUFBRSxJQUFJO2lCQUNYO2dCQUNELFVBQVUsRUFBRSxLQUFLLENBQUMsV0FBVztnQkFDN0IsV0FBVyxFQUFFLFFBQVE7YUFDdEIsQ0FBQztZQUNGLFlBQVk7U0FDYixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF6Q0Qsd0NBeUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGVjciBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyJztcbmltcG9ydCAqIGFzIGFwcHJ1bm5lciBmcm9tICdAYXdzLWNkay9hd3MtYXBwcnVubmVyLWFscGhhJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgQXBwUnVubmVyU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgbm9kZWpzUmVwbzogZWNyLlJlcG9zaXRvcnk7XG4gIGZhc3RhcGlSZXBvOiBlY3IuUmVwb3NpdG9yeTtcbn1cblxuZXhwb3J0IGNsYXNzIEFwcFJ1bm5lclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFwcFJ1bm5lclN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZSBmb3IgQXBwIFJ1bm5lclxuICAgIGNvbnN0IGluc3RhbmNlUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQXBwUnVubmVySW5zdGFuY2VSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ3Rhc2tzLmFwcHJ1bm5lci5hbWF6b25hd3MuY29tJyksXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgcGVybWlzc2lvbnMgdG8gYWNjZXNzIFNTTSBwYXJhbWV0ZXJzXG4gICAgaW5zdGFuY2VSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3NzbTpHZXRQYXJhbWV0ZXInLCAnc3NtOkdldFBhcmFtZXRlcnMnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbJ2Fybjphd3M6c3NtOio6KjpwYXJhbWV0ZXIvZGF0YWJhc2UvKiddLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIE5vZGUuanMgQXBwIFJ1bm5lciBTZXJ2aWNlXG4gICAgbmV3IGFwcHJ1bm5lci5TZXJ2aWNlKHRoaXMsICdOb2RlanNBcHBSdW5uZXInLCB7XG4gICAgICBzb3VyY2U6IGFwcHJ1bm5lci5Tb3VyY2UuZnJvbUVjcih7XG4gICAgICAgIGltYWdlQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgIH0sXG4gICAgICAgIHJlcG9zaXRvcnk6IHByb3BzLm5vZGVqc1JlcG8sXG4gICAgICAgIHRhZ09yRGlnZXN0OiAnbGF0ZXN0JyxcbiAgICAgIH0pLFxuICAgICAgaW5zdGFuY2VSb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIEZhc3RBUEkgQXBwIFJ1bm5lciBTZXJ2aWNlXG4gICAgbmV3IGFwcHJ1bm5lci5TZXJ2aWNlKHRoaXMsICdGYXN0QVBJQXBwUnVubmVyJywge1xuICAgICAgc291cmNlOiBhcHBydW5uZXIuU291cmNlLmZyb21FY3Ioe1xuICAgICAgICBpbWFnZUNvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICBwb3J0OiA4MDAwLFxuICAgICAgICB9LFxuICAgICAgICByZXBvc2l0b3J5OiBwcm9wcy5mYXN0YXBpUmVwbyxcbiAgICAgICAgdGFnT3JEaWdlc3Q6ICdsYXRlc3QnLFxuICAgICAgfSksXG4gICAgICBpbnN0YW5jZVJvbGUsXG4gICAgfSk7XG4gIH1cbn0iXX0=