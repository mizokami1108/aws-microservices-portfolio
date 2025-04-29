import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroservicesPortfolioStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPCの作成
    this.vpc = new ec2.Vpc(this, "MicroservicesVPC", {
      cidr: "10.0.0.0/16",
      maxAzs: 2, // 2つのアベイラビリティゾーンを使用
      subnetConfiguration: [
        // パブリックサブネット（インターネットゲートウェイ付き）
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        // プライベートサブネット（NATゲートウェイ付き）
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      // natGateways: 1, // コスト削減のため1つのNATゲートウェイを共有（本番環境では通常2つ）
      natGateways: 0, // コスト削減のためNATゲートウェイを使用しない
    });

    // VPCの出力を設定（CloudFormationコンソールで確認用）
    new cdk.CfnOutput(this, "VpcId", {
      value: this.vpc.vpcId,
      description: "VPC ID",
    });
  }
}
