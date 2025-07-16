# Deployment Guide

## Environment Configuration

This CDK project supports two environments:

### Development Environment
- **Branch**: `develop`
- **VPC CIDR**: `10.1.0.0/16`
- **Database**: Uses production RDS (no separate database created)
- **Stack Suffix**: `Dev`

### Production Environment
- **Branch**: `main`
- **VPC CIDR**: `10.0.0.0/16`
- **Database**: Creates dedicated RDS instance
- **Stack Suffix**: `Prod`

## GitHub Actions Workflows

### Dev Deployment (`develop` branch)
- Triggers on push to `develop` branch
- Uses `development` environment in GitHub
- Deploys stacks: VpcStackDev, EcrStackDev, CacheStackDev, AppRunnerStackDev
- **Does NOT create DatabaseStack**

### Prod Deployment (`main` branch)
- Triggers on push to `main` branch
- Uses `production` environment in GitHub
- Deploys all stacks including DatabaseStackProd

## Required GitHub Secrets

For both environments, configure these secrets in your GitHub repository:

- `AWS_ROLE_ARN`: IAM role ARN for GitHub Actions
- `AWS_REGION`: AWS region for deployment

For dev environment, if using production database:
- `PROD_DB_ENDPOINT`: Production database endpoint
- `PROD_DB_PORT`: Production database port
- `PROD_DB_SECRET_ARN`: Production database secret ARN

## Manual Deployment

### Development
```bash
cdk deploy --all --context environment=dev --context branch=develop
```

### Production
```bash
cdk deploy --all --context environment=prod --context branch=main
```

## Stack Dependencies

1. **VpcStack**: Creates VPC with environment-specific CIDR
2. **DatabaseStack**: Only created for production
3. **EcrStack**: ECR repositories for container images
4. **CacheStack**: Redis cache (depends on VPC)
5. **AppRunnerStack**: Application services (depends on VPC and ECR)

## Database Configuration

- **Production**: Creates dedicated RDS PostgreSQL instance
- **Development**: Connects to production RDS instance
  - Ensure dev VPC has connectivity to production RDS
  - Configure security groups to allow access from dev VPC CIDR (10.1.0.0/16)