import * as cdk from "aws-cdk-lib"
import type { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs"
import type * as sqs from "aws-cdk-lib/aws-sqs"
import * as apigw from "aws-cdk-lib/aws-apigateway"

interface PurchaseApiStackProps extends cdk.StackProps {
  deliveryOrderQueue: sqs.Queue
}

export class PurchaseApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PurchaseApiStackProps) {
    super(scope, id, props)

    const productSearchFunc = this.createProductSearchLambda()
    const productPurchaseFunc = this.createProductPurchaseLambda(props.deliveryOrderQueue)

    this.createApiGateway(productSearchFunc, productPurchaseFunc)
  }

  private createProductSearchLambda() {
    return new lambdaNodejs.NodejsFunction(this, "ProductSearchApiFunction", {
      functionName: "product-search-api-func",
      entry: "src/lambda/api/product-search.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
    })
  }

  private createProductPurchaseLambda(deliveryOrderQueue: sqs.Queue) {
    const func = new lambdaNodejs.NodejsFunction(this, "ProductPurchaseApiFunction", {
      functionName: "product-purchase-api-func",
      entry: "src/lambda/api/product-purchase.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      environment: {
        DELIVERY_ORDER_QUEUE_URL: deliveryOrderQueue.queueUrl,
      },
    })

    deliveryOrderQueue.grantSendMessages(func)

    return func
  }

  private createApiGateway(productSearchFunc: lambda.IFunction, productPurchaseFunc: lambda.IFunction) {
    const api = new apigw.RestApi(this, "Api", {
      restApiName: "purchase-api",
      defaultMethodOptions: {
        requestParameters: {
          "method.request.path.proxy": true,
        },
      },
    })

    const productResource = api.root.addResource("product")
    productResource.addResource("search").addMethod("GET", new apigw.LambdaIntegration(productSearchFunc))
    productResource.addResource("purchase").addMethod("POST", new apigw.LambdaIntegration(productPurchaseFunc))
  }
}
