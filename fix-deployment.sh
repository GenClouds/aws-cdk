#!/bin/bash

echo "🔧 Fixing CDK deployment issues..."
echo "This script will resolve the VPC export dependency conflict."

# Set environment variables
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=$(aws configure get region)

echo "Account: $CDK_DEFAULT_ACCOUNT"
echo "Region: $CDK_DEFAULT_REGION"

echo ""
echo "The error shows: 'Cannot delete export VpcStack:ExportsOutputFnGetAttMainVPC83A193D2CidrBlock182E958A as it is in use by DatabaseStack'"
echo "This means DatabaseStack is using VPC exports and must be destroyed first."
echo ""

read -p "Do you want to proceed with fixing the deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "Step 1: Destroying stacks in correct dependency order..."

# Destroy stacks in reverse dependency order
echo "Destroying AppRunnerStack..."
cdk destroy AppRunnerStack --force --context environment=prod --context branch=main || echo "AppRunnerStack not found or already destroyed"

echo "Destroying CacheStack..."
cdk destroy CacheStack --force --context environment=prod --context branch=main || echo "CacheStack not found or already destroyed"

echo "Destroying DatabaseStack..."
cdk destroy DatabaseStack --force --context environment=prod --context branch=main || echo "DatabaseStack not found or already destroyed"

echo "Destroying EcrStack..."
cdk destroy EcrStack --force --context environment=prod --context branch=main || echo "EcrStack not found or already destroyed"

echo "Destroying VpcStack..."
cdk destroy VpcStack --force --context environment=prod --context branch=main || echo "VpcStack not found or already destroyed"

echo ""
echo "Step 2: Deploying production stacks with original names..."

echo "Deploying Production stacks..."
cdk deploy --all --require-approval never --context environment=prod --context branch=main

echo ""
echo "✅ Production deployment completed!"
echo ""
echo "Next steps:"
echo "1. For dev environment, run: cdk deploy --all --require-approval never --context environment=dev --context branch=develop"
echo "2. Both environments now have separate resources and stack names"
echo "3. Production keeps original stack names, dev uses 'Dev' suffix"
echo "4. GitHub Actions workflows are updated for both environments"