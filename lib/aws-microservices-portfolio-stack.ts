import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VpcConstruct } from "./constructs/vpc";
import { DatabaseConstruct } from "./constructs/database";
import { EcsClusterConstruct } from "./constructs/ecs-cluster";
import { UserServiceConstruct } from "./constructs/user-service";
import { ProductServiceConstruct } from "./constructs/product-service";
import { OrderServiceConstruct } from "./constructs/order-service";
import { ApiGatewayConstruct } from "./constructs/api-gateway";

export class AwsMicroservicesPortfolioStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpcConstruct = new VpcConstruct(this, "VPC");

    // データベース
    const databaseConstruct = new DatabaseConstruct(this, "Database");

    // ECSクラスター
    const ecsClusterConstruct = new EcsClusterConstruct(this, "EcsCluster", {
      vpc: vpcConstruct.vpc,
    });

    // ユーザーサービス
    const userServiceConstruct = new UserServiceConstruct(this, "UserService", {
      cluster: ecsClusterConstruct.cluster,
      executionRole: ecsClusterConstruct.executionRole,
      repository: ecsClusterConstruct.userServiceRepo,
      userTable: databaseConstruct.userTable,
      vpc: vpcConstruct.vpc,
    });

    // 商品サービス
    const productServiceConstruct = new ProductServiceConstruct(
      this,
      "ProductService",
      {
        cluster: ecsClusterConstruct.cluster,
        executionRole: ecsClusterConstruct.executionRole,
        repository: ecsClusterConstruct.productServiceRepo,
        productTable: databaseConstruct.productTable,
        vpc: vpcConstruct.vpc,
      }
    );

    // 注文サービス
    const orderServiceConstruct = new OrderServiceConstruct(
      this,
      "OrderService",
      {
        cluster: ecsClusterConstruct.cluster,
        executionRole: ecsClusterConstruct.executionRole,
        repository: ecsClusterConstruct.orderServiceRepo,
        orderTable: databaseConstruct.orderTable,
        vpc: vpcConstruct.vpc,
      }
    );

    // API Gateway
    const apiGatewayConstruct = new ApiGatewayConstruct(this, "ApiGateway", {
      userServiceALB: userServiceConstruct.loadBalancer,
      productServiceALB: productServiceConstruct.loadBalancer,
      orderServiceALB: orderServiceConstruct.loadBalancer,
    });
  }
}
