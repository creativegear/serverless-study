import * as cdk from "aws-cdk-lib"
import { RemovalPolicy } from "aws-cdk-lib"
import * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs"
import * as eventSource from "aws-cdk-lib/aws-lambda-event-sources"
import * as sqs from "aws-cdk-lib/aws-sqs"
import type { Construct } from "constructs"

export class DeliveryOrderConsumerStack extends cdk.Stack {
  public readonly deliveryOrderTable: dynamodb.Table
  public readonly deliveryOrderQueue: sqs.Queue

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // 配送依頼用のキューを作成
    this.deliveryOrderQueue = this.createQueue()

    // 配送用のテーブルを作成
    this.deliveryOrderTable = this.createDynamoDBTable()

    // 配送依頼用のLambda関数を作成
    this.createConsumerLambda(this.deliveryOrderTable)
  }

  private createConsumerLambda(deliveryOrderTable: dynamodb.Table) {
    const func = new lambdaNodejs.NodejsFunction(this, "DeliveryOrderConsumerFunction", {
      functionName: "delivery-order-consumer-func",
      entry: "src/lambda/consumer/consumer.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      environment: {
        DELIVERY_ORDER_TABLE_NAME: deliveryOrderTable.tableName,
      },
    })

    // 配送依頼用のLambda関数にDynamoDBの読み書き権限を付与
    deliveryOrderTable.grantReadWriteData(func)

    // SQSメッセージ受信で、Lambda関数をトリガーするように設定
    func.addEventSource(new eventSource.SqsEventSource(this.deliveryOrderQueue))

    return func
  }

  private createQueue() {
    return new sqs.Queue(this, "DeliveryOrderQueue", {
      queueName: "delivery-order-queue",
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }

  private createDynamoDBTable() {
    // 配送依頼用のテーブルを作成
    const table = new dynamodb.Table(this, "DeliveryOrderTable", {
      tableName: "delivery-order",
      partitionKey: {
        name: "ID",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // 配送ステータスで検索できるようにインデックスを追加
    table.addGlobalSecondaryIndex({
      indexName: "DeliveryStatusIndex",
      partitionKey: { name: "STATUS", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    return table
  }
}
