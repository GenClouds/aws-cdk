import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface CloudFrontStackProps extends cdk.StackProps {
  // No dependencies needed
}

export class CloudFrontStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    // Get environment context
    const environment = this.node.tryGetContext('environment') || 'prod';
    const envPrefix = environment === 'dev' ? 'dev-' : '';
    
    // Define domain name based on environment
    const domainName = `${envPrefix}app.yahyagulshan.com`;
    
    // Create S3 bucket for static web hosting
    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: domainName,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    
    // Create Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: `OAI for ${domainName}`,
    });
    
    // Grant read permissions to CloudFront
    this.bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [this.bucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    }));
    
    // Use the provided wildcard certificate for yahyagulshan.com
    const certificateArn = 'arn:aws:acm:us-east-1:019721216237:certificate/a09c161c-72db-473b-9192-1f56b87ea531';
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);
    
    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, { originAccessIdentity }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      defaultRootObject: 'index.html',
      // No additional behaviors needed
      domainNames: [domainName],
      certificate: certificate,
      comment: `${environment} environment distribution`,
      enabled: true,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Add outputs
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'The ID of the CloudFront distribution',
      exportName: environment === 'dev' ? 'CloudFrontDistributionIdDev' : 'CloudFrontDistributionId',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'The domain name of the CloudFront distribution',
      exportName: environment === 'dev' ? 'CloudFrontDomainNameDev' : 'CloudFrontDomainName',
    });
    
    new cdk.CfnOutput(this, 'CloudFrontCustomDomain', {
      value: domainName,
      description: 'The custom domain name of the CloudFront distribution',
      exportName: environment === 'dev' ? 'CloudFrontCustomDomainDev' : 'CloudFrontCustomDomain',
    });
    
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'The name of the S3 bucket for static website hosting',
      exportName: environment === 'dev' ? 'S3BucketNameDev' : 'S3BucketName',
    });
    
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: this.bucket.bucketArn,
      description: 'The ARN of the S3 bucket for static website hosting',
      exportName: environment === 'dev' ? 'S3BucketArnDev' : 'S3BucketArn',
    });
    
    // Create Route53 record with the provided hosted zone ID
    const hostedZoneId = 'Z02872312HMZGXY5AN22B'; // Using the provided hosted zone ID
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: hostedZoneId,
      zoneName: 'yahyagulshan.com',
    });
      
      // Create A record pointing to the CloudFront distribution
      new route53.ARecord(this, 'AliasRecord', {
        zone: zone,
        recordName: envPrefix + 'app',
        target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(this.distribution)),
      });
    // Add output for the Route53 record
    new cdk.CfnOutput(this, 'Route53Record', {
      value: `A record created for ${domainName} pointing to CloudFront distribution`,
      description: 'Route53 DNS record',
    });
  }
}