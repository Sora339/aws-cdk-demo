import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: process.env.REGION });

export async function handler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing userId" }) };
    }

    const params = new ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": { S: userId } },
    });

    const { Items } = await client.send(params);

    if (!Items || Items.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: "No records found" }) };
    }

    const results = Items.map((item) => {
      const data = unmarshall(item);
      const flowOrderKey = Object.keys(data).find((key) => data[key]?.flowOrder === data.flowStatus);

      return {
        senkouId: data.senkouId,
        companyName: data.companyName,
        senkouName: data.senkouName,
        status: data.status,
        flowStatus: flowOrderKey || "Unknown",
      };
    });

    return { statusCode: 200, body: JSON.stringify(results) };
  } catch (error) {
    console.error("Error in get-senkou-list:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error" }) };
  }
}
