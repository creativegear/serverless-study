#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { PurchaseApiStack } from "../lib/api"
import { DeliveryOrderConsumerStack } from "../lib/consumer"
import { DeliveryBatchStack } from "../lib/batch"

const app = new cdk.App()
const TOKYO_REGION = "ap-northeast-1"

new PurchaseApiStack(app, "PurchaseApi", {
  env: {
    region: TOKYO_REGION,
  },
})

// new DeliveryOrderConsumerStack(app, "DeliveryOrderConsumer", {
// 	env: {
// 		region: TOKYO_REGION,
// 	},
// });

new DeliveryBatchStack(app, "DeliveryBatch", {
  env: {
    region: TOKYO_REGION,
  },
})
