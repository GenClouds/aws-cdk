# Multi-Environment CDK Setup

## Problem Solved

The original error occurred because:
1. VpcStack had exports being used by DatabaseStack
2. CDK couldn't update VpcStack due to dependency conflicts
3. No environment separation existed

## Solution Implemented

### 1. Environment-Specific Stack Naming
- **Production**: Keeps original stack names (`VpcStack`, `DatabaseStack`, etc.)
- **Development**: Uses `Dev` suffix (`VpcStackDev`, `DatabaseStackDev`, etc.)

### 2. Resource Separation
- **Production**: Uses `10.0.0.0/16` CIDR block
- **Development**: Uses `10.1.0.0/16` CIDR block
- **ECR Repositories**: Environment-specific naming
- **Database**: Only created in production (dev can connect to prod DB if needed)

### 3. Export Names
- **Production**: Maintains existing export names for backward compatibility
- **Development**: Uses new export naming convention

## Deployment Commands

### Production (main branch)
```bash
cdk deploy --all --require-approval never --context environment=prod --context branch=main
```

### Development (develop branch)
```bash
cdk deploy --all --require-approval never --context environment=dev --context branch=develop
```

## GitHub Actions Workflows

### Production Workflow (`.github/workflows/deploy.yml`)
- Triggers on `main` branch
- Deploys to production environment
- Uses original stack names

### Development Workflow (`.github/workflows/dev-deploy.yml`)
- Triggers on `develop` branch
- Deploys to development environment
- Uses `Dev` suffix stack names

## Stack Dependencies

### Production Stacks
1. `VpcStack` (base infrastructure)
2. `EcrStack` (container repositories)
3. `DatabaseStack` (depends on VpcStack)
4. `CacheStack` (depends on VpcStack)
5. `AppRunnerStack` (depends on all above)

### Development Stacks
1. `VpcStackDev` (separate VPC)
2. `EcrStackDev` (separate repositories)
3. `CacheStackDev` (depends on VpcStackDev)
4. `AppRunnerStackDev` (depends on VpcStackDev, EcrStackDev, CacheStackDev)

Note: No DatabaseStack in dev - applications can connect to production database if needed.

## Fixing Current Deployment Issue

Run the provided script:
```bash
chmod +x fix-deployment.sh
./fix-deployment.sh
```

This will:
1. Destroy existing stacks in correct order
2. Redeploy with new environment-aware configuration
3. Maintain production compatibility

## Environment Variables

Both environments support:
- `REDIS_HOST`: Automatically configured from Cache stack exports
- `REDIS_PORT`: Set to 6379
- `REDIS_TLS_DISABLED`: Set to true for development

## Next Steps

1. Run the fix script to resolve current deployment issues
2. Test production deployment
3. Deploy development environment
4. Update application configurations if needed
5. Test both environments independently