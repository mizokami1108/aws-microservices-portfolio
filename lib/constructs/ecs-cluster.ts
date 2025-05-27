import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";

export interface EcsClusterConstructProps {
  vpc: ec2.Vpc;
}

export class EcsClusterConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly executionRole: iam.Role;
  public readonly userServiceRepo: ecr.Repository;
  public readonly productServiceRepo: ecr.Repository;
  public readonly orderServiceRepo: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcsClusterConstructProps) {
    super(scope, id);

    // ECSクラスター
    this.cluster = new ecs.Cluster(this, "MicroservicesCluster", {
      clusterName: "MicroservicesCluster",
      vpc: props.vpc,
      containerInsights: true,
    });

    // タスク実行ロール
    this.executionRole = new iam.Role(this, "EcsTaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
    });

    // ECRリポジトリ
    this.userServiceRepo = new ecr.Repository(this, "UserServiceRepo", {
      repositoryName: "user-service",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.productServiceRepo = new ecr.Repository(this, "ProductServiceRepo", {
      repositoryName: "product-service",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.orderServiceRepo = new ecr.Repository(this, "OrderServiceRepo", {
      repositoryName: "order-service",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 出力
    new cdk.CfnOutput(this, "ClusterId", { value: this.cluster.clusterName });
    new cdk.CfnOutput(this, "UserServiceRepoUri", {
      value: this.userServiceRepo.repositoryUri,
    });
    new cdk.CfnOutput(this, "ProductServiceRepoUri", {
      value: this.productServiceRepo.repositoryUri,
    });
    new cdk.CfnOutput(this, "OrderServiceRepoUri", {
      value: this.orderServiceRepo.repositoryUri,
    });
  }
}
