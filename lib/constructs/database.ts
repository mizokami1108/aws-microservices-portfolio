import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";

export class DatabaseConstruct extends Construct {
  public readonly userTable: dynamodb.Table;
  public readonly productTable: dynamodb.Table;
  public readonly orderTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // ユーザーテーブル
    this.userTable = new dynamodb.Table(this, "UserTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 商品テーブル
    this.productTable = new dynamodb.Table(this, "ProductTable", {
      partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 注文テーブル
    this.orderTable = new dynamodb.Table(this, "OrderTable", {
      partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 出力
    new cdk.CfnOutput(this, "UserTableName", {
      value: this.userTable.tableName,
    });
    new cdk.CfnOutput(this, "ProductTableName", {
      value: this.productTable.tableName,
    });
    new cdk.CfnOutput(this, "OrderTableName", {
      value: this.orderTable.tableName,
    });
  }
}
