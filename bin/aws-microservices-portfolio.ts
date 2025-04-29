#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsMicroservicesPortfolioStack } from "../lib/aws-microservices-portfolio-stack";

const app = new cdk.App();
new AwsMicroservicesPortfolioStack(app, "AwsMicroservicesPortfolioStack", {
  /* 'env' を指定しない場合、このスタックは環境に依存しないスタックになります。
   * アカウントやリージョンに依存する機能やコンテキストの参照は使えなくなりますが、
   * 一度合成されたテンプレートをどの環境にもデプロイできるようになります。
   */
  /* 次の行のコメントを外すと、このスタックは現在の CLI 設定に基づく
   * AWS アカウントとリージョンに特化したものになります。
   */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* 特定のアカウントとリージョンにこのスタックをデプロイしたい場合は、
   * 次の行のコメントを外してください。
   */
  // env: { account: '123456789012', region: 'us-east-1' },
  env: { region: "ap-northeast-1" }, // 東京リージョンを明示的に指定
  /* 詳細は以下を参照してください:
   * https://docs.aws.amazon.com/cdk/latest/guide/environments.html
   */
});
