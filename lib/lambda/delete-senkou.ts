import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.REGION });

export async function handler(event: any) {
  try {
    // ✅ `senkouId` をパスパラメータから取得
    const senkouId = event.pathParameters?.senkouId;
    if (!senkouId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing senkouId" }) };
    }

    // ✅ DynamoDB の `Key` を `senkouId` に変更
    const params = new DeleteItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { senkouId: { S: senkouId } },
    });

    await client.send(params);

    return { statusCode: 200, body: JSON.stringify({ message: "Deleted successfully" }) };
  } catch (error) {
    console.error("Error in delete-senkou:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error" }) };
  }
}
