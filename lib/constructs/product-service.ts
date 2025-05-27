import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ConfigLoader } from "../utils/config-loader";

export interface ProductServiceConstructProps {
  cluster: ecs.Cluster;
  executionRole: iam.Role;
  repository: ecr.Repository;
  productTable: dynamodb.Table;
  vpc: ec2.Vpc;
}

export class ProductServiceConstruct extends Construct {
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(
    scope: Construct,
    id: string,
    props: ProductServiceConstructProps
  ) {
    super(scope, id);

    // 設定ファイルから設定を読み込み
    const serviceConfig = ConfigLoader.getServiceConfig("productService");

    // タスク定義
    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef", {
      memoryLimitMiB: serviceConfig.memoryLimitMiB,
      cpu: serviceConfig.cpu,
      executionRole: props.executionRole,
    });

    // タスク定義にコンテナを追加
    const container = taskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromEcrRepository(props.repository),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "product-service" }),
      environment: {
        DDB_TABLE: props.productTable.tableName,
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // セキュリティグループの作成
    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      "ServiceSecurityGroup",
      {
        vpc: props.vpc,
        description: "Security group for product service",
        allowAllOutbound: true,
      }
    );

    // FargateサービスをECSクラスターに追加
    this.service = new ecs.FargateService(this, "Service", {
      serviceName: "ProductService",
      cluster: props.cluster,
      taskDefinition,
      desiredCount: serviceConfig.desiredCount,
      assignPublicIp: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroups: [serviceSecurityGroup],
    });

    // Application Load Balancerの作成
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      "LoadBalancer",
      {
        vpc: props.vpc,
        internetFacing: true,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // ターゲットグループの作成
    const targetGroup = new elbv2.ApplicationTargetGroup(this, "TargetGroup", {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc: props.vpc,
      healthCheck: { path: "/health" },
    });

    // ALBのリスナー設定
    const listener = this.loadBalancer.addListener("Listener", {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Fargateサービスをターゲットグループにアタッチ
    this.service.attachToApplicationTargetGroup(targetGroup);

    // セキュリティグループの設定（ALBからのアクセスを許可）
    serviceSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(
        this.loadBalancer.connections.securityGroups[0].securityGroupId
      ),
      ec2.Port.tcp(3000),
      "Allow access from ALB"
    );

    // DynamoDBへのアクセス権限を付与
    props.productTable.grantReadWriteData(taskDefinition.taskRole);

    // 設定の表示（デバッグ用）
    console.log(
      `Product Service - Desired Count: ${serviceConfig.desiredCount}`
    );
  }
}
