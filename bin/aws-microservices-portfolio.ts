#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AwsMicroservicesPortfolioStack } from "../lib/aws-microservices-portfolio-stack";

const app = new cdk.App();
new AwsMicroservicesPortfolioStack(app, "AwsMicroservicesPortfolioStack", {
  env: { region: "ap-northeast-1" }, // 東京リージョンを明示
});
