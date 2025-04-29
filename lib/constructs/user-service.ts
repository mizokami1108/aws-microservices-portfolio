import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface UserServiceConstructProps {
  cluster: ecs.Cluster;
  executionRole: iam.Role;
  repository: ecr.Repository;
  userTable: dynamodb.Table;
}

export class UserServiceConstruct extends Construct {
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: UserServiceConstructProps) {
    super(scope, id);

    // タスク定義
    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef", {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole: props.executionRole,
    });

    // タスク定義にコンテナを追加
    const container = taskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"), // 一時的なイメージ
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "user-service" }),
      environment: {
        DDB_TABLE: props.userTable.tableName,
      },
    });

    container.addPortMappings({
      containerPort: 3000,
    });

    // FargateサービスをECSクラスターに追加
    this.service = new ecs.FargateService(this, "Service", {
      cluster: props.cluster,
      taskDefinition,
      desiredCount: 0, // コスト削減のため、初期値は0に設定
      assignPublicIp: true, // パブリックサブネットでの実行に必要
    });

    // DynamoDBへのアクセス権限を付与
    props.userTable.grantReadWriteData(taskDefinition.taskRole);
  }
}
