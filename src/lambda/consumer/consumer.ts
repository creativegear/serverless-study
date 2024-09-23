import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"
import type { Context, SQSEvent, SQSRecord } from "aws-lambda"
import * as uuid from "node-uuid"

const dynamoDBClient = new DynamoDBClient({})

export const handler = async (event: SQSEvent, _context: Context) => {
  const promises = event.Records.map(async (record: SQSRecord) => {
    const productId = JSON.parse(record.body).productId
    console.log(`商品を購入しました: ${productId}`)
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
        PRODUCT_ID: { N: `${productId}` },
        STATUS: { S: "WAITING" },
        ORDERED_DATETIME: { S: new Date().toISOString() },
      },
    }),
  )
}
