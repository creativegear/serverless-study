import type { Context, EventBridgeEvent } from "aws-lambda"

export const handler = async (_event: EventBridgeEvent<"Scheduled Event", unknown>, _context: Context): Promise<void> => {
  console.log("Hello, world!")
}
