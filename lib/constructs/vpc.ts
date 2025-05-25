import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import { ConfigLoader } from "../utils/config-loader";

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // 設定ファイルから設定を読み込み
    const config = ConfigLoader.loadConfig();

    // VPCの作成
    this.vpc = new ec2.Vpc(this, "MicroservicesVPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: config.vpc.maxAzs,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      natGateways: config.vpc.natGateways,
    });

    // 出力
    new cdk.CfnOutput(this, "VpcId", { value: this.vpc.vpcId });

    console.log(
      `VPC Configuration - MaxAZs: ${config.vpc.maxAzs}, NAT Gateways: ${config.vpc.natGateways}`
    );
  }
}
