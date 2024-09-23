import { type AttributeValue, DynamoDBClient, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import type { Context, EventBridgeEvent } from "aws-lambda"

const dynamoDBClient = new DynamoDBClient({})

export const handler = async (_event: EventBridgeEvent<"Scheduled Event", unknown>, _context: Context): Promise<void> => {
  const orders = await selectDeliveryOrders()
  await updateOrder(orders.Items!)
}

const selectDeliveryOrders = async () => {
  return await dynamoDBClient.send(
    new QueryCommand({
      TableName: process.env.DELIVERY_ORDER_TABLE_NAME,
      IndexName: "DeliveryStatusIndex",
      KeyConditionExpression: "#STATUS = :STATUS",
      ExpressionAttributeNames: {
        "#STATUS": "STATUS",
      },
      ExpressionAttributeValues: {
        ":STATUS": { S: "WAITING" },
      },
    }),
  )
}

const updateOrder = async (items: Record<string, AttributeValue>[]) => {
  const updatePromises = items.map(async (item) => {
    return await dynamoDBClient.send(
      new UpdateItemCommand({
        TableName: process.env.DELIVERY_ORDER_TABLE_NAME,
        Key: {
          ID: item.ID,
        },
        UpdateExpression: "set #STATUS = :STATUS",
        ExpressionAttributeNames: {
          "#STATUS": "STATUS",
        },
        ExpressionAttributeValues: {
          ":STATUS": { S: "COMPLETED" },
        },
      }),
    )
  })
  await Promise.all(updatePromises)
}
