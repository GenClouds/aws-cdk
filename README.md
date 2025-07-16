# AWS CDK Infrastructure

This repository contains the AWS CDK infrastructure code for deploying Node.js and FastAPI applications using AWS CDK with GitHub Actions CI/CD.

## Prerequisites :

- Node.js 18 or later installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Docker installed (for local development)
- Proper AWS OIDC connection configured in your AWS account (see setup below)

## Infrastructure Components :

- VPC with public, private, and isolated subnets
- Aurora PostgreSQL database
- ECR repositories for Node.js and FastAPI applications
- App Runner services for both applications
- SSM Parameters for database configuration

## AWS OIDC Connection Setup

For GitHub Actions to deploy to AWS securely, you need to set up an OpenID Connect (OIDC) provider:

1. In the AWS IAM console, create an OIDC provider with:
   - Provider URL: `token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`

2. Create an IAM role with admin and ECR access permissions:

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "ecr:GetAuthorizationToken",
                   "ecr:BatchCheckLayerAvailability",
                   "ecr:GetDownloadUrlForLayer",
                   "ecr:BatchGetImage"
               ],
               "Resource": "*"
           }
       ]
   }
   ```

3. Configure the trust relationship for this role:

   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": {
                   "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
               },
               "Action": "sts:AssumeRoleWithWebIdentity",
               "Condition": {
                   "StringEquals": {
                       "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                   },
                   "StringLike": {
                       "token.actions.githubusercontent.com:sub": "repo:Tulio-Health/*"
                   }
               }
           },
           {
               "Effect": "Allow",
               "Principal": {
                   "Service": "build.apprunner.amazonaws.com"
               },
               "Action": "sts:AssumeRole"
           }
       ]
   }
   ```

4. Add ECR repository Node Js and Fast API permissions:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowAppRunner",
         "Effect": "Allow",
         "Principal": {
           "Service": "build.apprunner.amazonaws.com"
         },
         "Action": [
           "ecr:BatchGetImage",
           "ecr:GetDownloadUrlForLayer"
         ]
       }
     ]
   }
   ```

## GitHub Secrets Setup

Add the following secrets to your GitHub repository:

- `AWS_ROLE_ARN`: The ARN of the IAM role created above 
- `AWS_REGION`: The AWS region to deploy to (e.g., `us-east-2`)

## Local Development and Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Bootstrap CDK (first time only):
   ```bash
   cdk bootstrap
   ```

3. Deploy the stacks:
   ```bash
   cdk deploy --all
   ```

4. Destroy the stacks: 
   ```bash
   cdk destroy --all
   ```
   - make sure you run the first two.

## CI/CD Workflow

This repository uses GitHub Actions to automatically test and deploy the CDK infrastructure:

- On pull requests: Runs tests to validate the CDK code
- On push to main: Deploys the infrastructure to AWS

The workflow uses AWS OIDC for secure authentication without storing long-lived credentials.

### Workflow Details

```yaml
name: CDK Workflow

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  build-and-test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

  cdk-deploy:
    name: CDK Deploy
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install CDK
        run: npm install -g aws-cdk

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}
          role-session-name: GitHubActionsCDKDeploy

      - name: CDK Bootstrap
        run: cdk bootstrap

      - name: CDK Synth
        run: cdk synth

      - name: CDK Deploy
        run: cdk deploy --all --require-approval never
```

## Troubleshooting <<<<<

- If GitHub Actions deployment fails with permission errors, check the AWS role ARN and trust relationship configuration
- For ECR access issues, verify the ECR repository policy includes the correct permissions for App Runner
- Make sure all required GitHub secrets are correctly set up in your repository settings
- In case first time running the cdk or after the destroy - all 
  - 1. app-runner - will throw error, issue is because of ECR not having the image for the apis 
	- 2. Run the test for the apis repo 
	3. Re-run the cdk 
	4. Check the image name - hash update 
	5. App runner service name - inside the APIs repo 
		1. Grab it from AWS 
		2. 
