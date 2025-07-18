import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

interface CloudFrontStackProps extends cdk.StackProps {
  nodejsServiceUrl: string;
  fastapiServiceUrl: string;
}

export class CloudFrontStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    // Get environment context
    const environment = this.node.tryGetContext('environment') || 'prod';
    const envPrefix = environment === 'dev' ? 'dev-' : '';
    
    // Define domain name based on environment
    const domainName = `${envPrefix}app.yahyagulshan.com`;
    
    // Use the provided wildcard certificate for yahyagulshan.com
    const certificateArn = 'arn:aws:acm:us-east-1:019721216237:certificate/a09c161c-72db-473b-9192-1f56b87ea531';
    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);
    
    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(props.nodejsServiceUrl.replace('https://', '')),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(props.fastapiServiceUrl.replace('https://', '')),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        }
      },
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