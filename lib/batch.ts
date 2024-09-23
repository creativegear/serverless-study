import * as cdk from "aws-cdk-lib"
import * as events from "aws-cdk-lib/aws-events"
import * as targets from "aws-cdk-lib/aws-events-targets"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs"
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb"
import type { Construct } from "constructs"

interface PurchaseBatchStackProps extends cdk.StackProps {
  deliveryOrderTable: dynamodb.Table
}

export class DeliveryBatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PurchaseBatchStackProps) {
    super(scope, id, props)

    const deliveryFunc = this.createDeliveryBatchLambda()
    props.deliveryOrderTable.grantReadWriteData(deliveryFunc)

    this.createCronScheduler(deliveryFunc)
  }

  private createDeliveryBatchLambda() {
    return new lambdaNodejs.NodejsFunction(this, "DeliveryBatchFunction", {
      functionName: "delivery-batch-func",
      entry: "src/lambda/batch/delivery.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
    })
  }

  private createCronScheduler(deliveryFunc: lambda.IFunction) {
    const rule = new events.Rule(this, "WarmupRule", {
      ruleName: "delivery-batch-rule",
      schedule: events.Schedule.cron({
        minute: "0/1", // 1分ごとに実行
        // hour: "9", minute: "0"
      }),
    })
    rule.addTarget(new targets.LambdaFunction(deliveryFunc))
  }
}
