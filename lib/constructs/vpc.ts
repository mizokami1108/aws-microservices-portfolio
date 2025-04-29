import { Construct } from "constructs";
import * as es2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";

export class VpcConstruct extends Construct {
  public readonly vpc: es2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // VPOの作成
    this.vpc = new es2.Vpc(this, "MicroservicesVPC", {
      ipAddresses: es2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2, // 2つのアベイラビリティゾーンを使用
      subnetConfiguration: [
        { name: "Public", subnetType: es2.SubnetType.PUBLIC, cidrMask: 24 },
        {
          name: "Private",
          subnetType: es2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      natGateways: 0, // コスト削減のためNATゲートウェイを使用しない
    });

    // VPCの出力を設定（CloudFormationコンソールで確認用）
    new cdk.CfnOutput(this, "VpcId", {
      value: this.vpc.vpcId,
    });
  }
}
