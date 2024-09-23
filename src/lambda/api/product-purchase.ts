import type { APIGatewayEvent } from "aws-lambda"
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"

const sqsClient = new SQSClient()

export const handler = async (event: APIGatewayEvent) => {
  const requestBody = JSON.parse(event.body!)
  const productId = requestBody.productId

  await publishSendSqsMessage(productId)

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: productId,
    }),
  }
}

const publishSendSqsMessage = async (productId: string) => {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: process.env.DELIVERY_ORDER_QUEUE_URL,
      MessageBody: JSON.stringify({
        productId: productId,
      }),
    }),
  )
}
