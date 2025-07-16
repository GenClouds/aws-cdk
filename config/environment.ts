export interface EnvironmentConfig {
  environment: string;
  branch: string;
  vpc: {
    cidr: string;
  };
  database: {
    create: boolean;
    // For dev environment, these would point to production RDS
    endpoint?: string;
    port?: string;
    secretArn?: string;
  };
  tags: {
    [key: string]: string;
  };
}

export const getEnvironmentConfig = (environment: string, branch: string): EnvironmentConfig => {
  const baseConfig = {
    environment,
    branch,
    tags: {
      Environment: environment,
      Branch: branch,
      Project: 'microservices-deployment'
    }
  };

  if (environment === 'dev') {
    return {
      ...baseConfig,
      vpc: {
        cidr: '10.1.0.0/16'
      },
      database: {
        create: false,
        // Dev environment will use production RDS
        // These values should be retrieved from SSM Parameter Store or environment variables
        endpoint: process.env.PROD_DB_ENDPOINT,
        port: process.env.PROD_DB_PORT || '5432',
        secretArn: process.env.PROD_DB_SECRET_ARN
      }
    };
  }

  // Production configuration
  return {
    ...baseConfig,
    vpc: {
      cidr: '10.0.0.0/16'
    },
    database: {
      create: true
    }
  };
};