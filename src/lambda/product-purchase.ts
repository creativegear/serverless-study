export const handler = async () => {
  const responseBody = { message: "Hello World2!" }
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(responseBody),
  }

  return response
}
