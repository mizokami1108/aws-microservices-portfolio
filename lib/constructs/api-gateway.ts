import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as cdk from "aws-cdk-lib";

export interface ApiGatewayConstructProps {
  userServiceALB: elbv2.ApplicationLoadBalancer;
  productServiceALB: elbv2.ApplicationLoadBalancer;
  orderServiceALB: elbv2.ApplicationLoadBalancer;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // API Gatewayの作成
    this.api = new apigateway.RestApi(this, "MicroservicesApi", {
      restApiName: "Microservices API",
      description: "API Gateway for Microservices Portfolio",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // ユーザーサービスの統合
    const usersResource = this.api.root.addResource("users");
    const userIntegration = new apigateway.HttpIntegration(
      `http://${props.userServiceALB.loadBalancerDnsName}/users`,
      {
        httpMethod: "ANY",
        proxy: true,
      }
    );

    usersResource.addMethod("ANY", userIntegration);

    // 個別ユーザーリソース
    const userResource = usersResource.addResource("{userId}");
    const userByIdIntegration = new apigateway.HttpIntegration(
      `http://${props.userServiceALB.loadBalancerDnsName}/users/{userId}`,
      {
        httpMethod: "ANY",
        proxy: true,
      }
    );
    userResource.addMethod("ANY", userByIdIntegration);

    // 商品サービスの統合
    const productsResource = this.api.root.addResource("products");
    const productIntegration = new apigateway.HttpIntegration(
      `http://${props.productServiceALB.loadBalancerDnsName}/products`,
      {
        httpMethod: "ANY",
        proxy: true,
      }
    );

    productsResource.addMethod("ANY", productIntegration);

    // 個別商品リソース
    const productResource = productsResource.addResource("{productId}");
    const productByIdIntegration = new apigateway.HttpIntegration(
      `http://${props.productServiceALB.loadBalancerDnsName}/products/{productId}`,
      {
        httpMethod: "ANY",
        proxy: true,
      }
    );
    productResource.addMethod("ANY", productByIdIntegration);

    // 注文サービスの統合
    const ordersResource = this.api.root.addResource("orders");
    const orderIntegration = new apigateway.HttpIntegration(
      `http://${props.orderServiceALB.loadBalancerDnsName}/orders`,
      {
        httpMethod: "ANY",
        proxy: true,
      }
    );

    ordersResource.addMethod("ANY", orderIntegration);

    // 出力
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: this.api.url,
    });
  }
}
