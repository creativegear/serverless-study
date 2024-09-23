#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { PurchaseApiStack } from "../lib/api"
import { DeliveryOrderConsumerStack } from "../lib/consumer"
import { DeliveryBatchStack } from "../lib/batch"

const app = new cdk.App()
const TOKYO_REGION = "ap-northeast-1"

// 配送依頼受信用Consumerスタック
const consumer = new DeliveryOrderConsumerStack(app, "DeliveryOrderConsumer", {
  env: {
    region: TOKYO_REGION,
  },
})

// 商品購入API用のAPIスタック
new PurchaseApiStack(app, "PurchaseApi", {
  deliveryOrderQueue: consumer.deliveryOrderQueue,
  env: {
    region: TOKYO_REGION,
  },
})

// 配送処理用のバッチスタック
new DeliveryBatchStack(app, "DeliveryBatch", {
  deliveryOrderTable: consumer.deliveryOrderTable,
  env: {
    region: TOKYO_REGION,
  },
})
