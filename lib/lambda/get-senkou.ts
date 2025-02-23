import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: process.env.REGION });

export async function handler(event: any) {
  try {
    const senkouId = event.pathParameters?.senkouId; // ✅ パスパラメータから取得

    if (!senkouId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing senkouId" }) };
    }

    const params = new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { senkouId: { S: senkouId } },
    });

    const { Item } = await client.send(params);

    if (!Item) {
      return { statusCode: 404, body: JSON.stringify({ message: "Senkou not found" }) };
    }

    return { statusCode: 200, body: JSON.stringify(unmarshall(Item)) };
  } catch (error) {
    console.error("Error in get-senkou:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error" }) };
  }
}
