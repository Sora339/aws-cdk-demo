import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto"; // ✅ UUID 生成用

const client = new DynamoDBClient({ region: process.env.REGION });

export async function handler(event: any) {
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    // ✅ senkouId のみ UUID を生成
    const senkouId = randomUUID();

    // userId はリクエストから取得（UUID を生成しない）
    const userId = body.userId;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing userId" }) };
    }

    const newItem = {
      senkouId,
      userId,
      companyName: body.companyName,
      senkouName: body.senkouName,
      status: body.status ?? 1, // デフォルト値
      flowStatus: body.flowStatus ?? 0,
      ...body.flows, // フロー情報をそのまま保存
    };

    const params = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: marshall(newItem, { removeUndefinedValues: true }),
    });

    await client.send(params);

    return { statusCode: 201, body: JSON.stringify({ message: "Created", senkouId }) };
  } catch (error) {
    console.error("Error in create-senkou:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error" }) };
  }
}
