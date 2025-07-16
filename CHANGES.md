# Changes Made for Dev/Prod Environment Setup

## Summary of Issues Fixed

### 1. GitHub Actions Workflows
- **Dev Workflow (`dev-deploy.yml`)**:
  - Fixed environment from `production` to `development`
  - Added context parameters for environment and branch
  - Updated stack names to use `Dev` suffix
  - Removed database stack from deployment options (dev doesn't create DB)

- **Prod Workflow (`prod-deploy.yml`)**:
  - Fixed trigger branches from `dev` to `main`
  - Added context parameters for environment and branch
  - Updated stack names to use `Prod` suffix

### 2. CDK Infrastructure Changes

#### Main App (`bin/aws-cdk.ts`)
- Added environment and branch context detection
- Implemented conditional database stack creation (only for `main` branch)
- Added environment-specific stack naming with suffixes (`Dev`/`Prod`)
- Added environment-specific tags

#### VPC Stack (`lib/vpc-stack.ts`)
- Added different CIDR blocks:
  - Dev: `10.1.0.0/16`
  - Prod: `10.0.0.0/16`

#### Database Stack (`lib/database-stack.ts`)
- Added environment-specific instance identifiers
- Updated SSM parameter paths to include environment

#### ECR Stack (`lib/ecr-stack.ts`)
- Added environment-specific repository names

#### Cache Stack (`lib/cache-stack.ts`)
- Added environment-specific resource naming
- Fixed tagging logic

#### AppRunner Stack (`lib/apprunner-stack.ts`)
- Updated to use environment-specific export names for Redis connection
- Added environment-specific VPC connector naming
- Updated all CloudFormation outputs with environment suffixes

### 3. Configuration Files
- **CDK Context (`cdk.json`)**: Added environment-specific configurations
- **Environment Config (`config/environment.ts`)**: Created for database connection management
- **Documentation**: Added `DEPLOYMENT.md` and `CHANGES.md`

## Key Features Implemented

1. **Environment Isolation**: Dev and Prod environments are completely separate
2. **Conditional Database**: Dev uses production RDS, Prod creates its own
3. **Different VPC CIDRs**: Prevents IP conflicts between environments
4. **Environment-Specific Naming**: All resources have environment suffixes
5. **Branch-Based Deployment**: 
   - `develop` branch → Dev environment
   - `main` branch → Prod environment

## Required Actions

1. **GitHub Secrets**: Ensure both environments have required AWS credentials
2. **Database Access**: Configure security groups to allow dev VPC access to prod RDS
3. **Environment Variables**: Set production database connection details for dev environment
4. **Testing**: Test both workflows before production deployment

## Stack Names After Changes

### Development Environment
- VpcStackDev
- EcrStackDev
- CacheStackDev
- AppRunnerStackDev
- (No DatabaseStack)

### Production Environment
- VpcStackProd
- DatabaseStackProd
- EcrStackProd
- CacheStackProd
- AppRunnerStackProd