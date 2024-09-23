import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import type { Context, SQSEvent, SQSRecord } from "aws-lambda"
import * as uuid from "node-uuid"

const dynamoDBClient = new DynamoDBClient({})

// 配送依頼のキューからメッセージを受信し、DBに配送依頼を登録
export const handler = async (event: SQSEvent, _context: Context) => {
  // SQSメッセージを受信し、
  const promises = event.Records.map(async (record: SQSRecord) => {
    const productId = JSON.parse(record.body).productId
    console.log(`商品を購入しました: ${productId}`)

    // 配送依頼をDBに登録
    return insertOrder(productId)
  })

  await Promise.all(promises)
}

const insertOrder = async (productId: string) => {
  return dynamoDBClient.send(
    new PutItemCommand({
      TableName: process.env.DELIVERY_ORDER_TABLE_NAME,
      Item: {
        ID: { S: uuid.v4() },
        PRODUCT_ID: { N: `${productId}` }, // 商品ID
        STATUS: { S: "WAITING" }, // 配送ステータス
        ORDERED_DATETIME: { S: new Date().toISOString() }, // 注文日時
      },
    }),
  )
}
