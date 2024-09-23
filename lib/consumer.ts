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

    this.deliveryOrderQueue = this.createQueue()
    this.deliveryOrderTable = this.createDynamoDBTable()
    const consumerLambda = this.createConsumerLambda(this.deliveryOrderTable)

    consumerLambda.addEventSource(new eventSource.SqsEventSource(this.deliveryOrderQueue))
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

    deliveryOrderTable.grantReadWriteData(func)

    return func
  }

  private createQueue() {
    return new sqs.Queue(this, "DeliveryOrderQueue", {
      queueName: "delivery-order-queue",
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }

  private createDynamoDBTable() {
    return new dynamodb.Table(this, "DeliveryOrderTable", {
      tableName: "delivery-order",
      partitionKey: {
        name: "ID",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }
}
