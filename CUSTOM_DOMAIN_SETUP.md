# Custom Domain Setup for CloudFront

This document explains how to set up custom domains for the CloudFront distributions.

## Domain Configuration

- Production: app.yahyagulshan.com (main branch)
- Development: dev-app.yahyagulshan.com (develop branch)

## Prerequisites

1. SSL certificate in AWS Certificate Manager (ACM) - ✅ DONE
   - Certificate ARN: `arn:aws:acm:us-east-1:019721216237:certificate/a09c161c-72db-473b-9192-1f56b87ea531`
   - Covers wildcard domain: `*.yahyagulshan.com`

2. Route53 hosted zone for `yahyagulshan.com` - ✅ DONE
   - Hosted Zone ID: `Z02872312HMZGXY5AN22B`

## Setup Steps

### 1. Create SSL Certificate (if not already done)

1. Go to AWS Certificate Manager in the `us-east-1` region
2. Request a public certificate
3. Add domain names: `app.yahyagulshan.com` and `dev-app.yahyagulshan.com`
4. Choose DNS validation
5. Create the certificate and follow the validation steps

### 2. Deploy the CloudFront Stack

The certificate ARN is already configured in the code. Simply deploy the stack:

```bash
# For production
cdk deploy CloudFrontStack

# For development
cdk deploy CloudFrontStackDev --context environment=dev
```

### 3. DNS Setup (Automatic with Route53)

The deployment will automatically create DNS records in Route53 using the hosted zone ID Z02872312HMZGXY5AN22B:

- For production: `app.yahyagulshan.com` → CloudFront Distribution
- For development: `dev-app.yahyagulshan.com` → CloudFront Distribution

## Verification

After deployment, verify that your custom domains are working:

1. Wait for DNS propagation (can take up to 24-48 hours)
2. Visit your custom domain in a browser
3. Verify that HTTPS is working correctly