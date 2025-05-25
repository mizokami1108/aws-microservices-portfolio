export interface PortfolioConfig {
  environment: string;
  services: {
    userService: ServiceConfig;
    productService: ServiceConfig;
    orderService: ServiceConfig;
  };
  database: {
    billingMode: string;
  };
  vpc: {
    maxAzs: number;
    natGateways: number;
  };
}

export interface ServiceConfig {
  desiredCount: number;
  memoryLimitMiB: number;
  cpu: number;
}
