import * as cdk from "aws-cdk-lib"
import type { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs"
import * as apigw from "aws-cdk-lib/aws-apigateway"

export class PurchaseApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const productSearchFunc = this.createProductSearchLambda()
    const productPurchaseFunc = this.createProductPurchaseLambda()

    this.createApiGateway(productSearchFunc, productPurchaseFunc)
  }

  private createProductSearchLambda() {
    return new lambdaNodejs.NodejsFunction(this, "ProductSearchApiFunction", {
      functionName: "product-search-api-func",
      entry: "src/lambda/product-search.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
    })
  }

  private createProductPurchaseLambda() {
    return new lambdaNodejs.NodejsFunction(this, "ProductPurchaseApiFunction", {
      functionName: "product-purchase-api-func",
      entry: "src/lambda/product-purchase.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
    })
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
