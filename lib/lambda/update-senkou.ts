import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: process.env.REGION });

export async function handler(event: any) {
  try {
    // ✅ `senkouId` をパスパラメータから取得
    const senkouId = event.pathParameters?.senkouId;
    if (!senkouId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing senkouId" }) };
    }

    // ✅ `event.body` が文字列なら `JSON.parse` し、オブジェクトならそのまま使用
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    if (Object.keys(body).length === 0) {
      return { statusCode: 400, body: JSON.stringify({ message: "No update fields provided" }) };
    }

    // ✅ UpdateExpression を動的に構築
    let updateExpression = "SET ";
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    Object.entries(body).forEach(([key, value], index) => {
      const placeholder = `#field${index}`;
      const valuePlaceholder = `:value${index}`;

      updateExpression += `${placeholder} = ${valuePlaceholder}, `;
      expressionAttributeNames[placeholder] = key;
      expressionAttributeValues[valuePlaceholder] = value;
    });

    // ✅ 最後のカンマを削除
    updateExpression = updateExpression.slice(0, -2);

    // ✅ UpdateItemCommand を実行
    const params = new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { senkouId: { S: senkouId } },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues, { removeUndefinedValues: true }),
      ReturnValues: "ALL_NEW",
    });

    const { Attributes } = await client.send(params);

    return {
      statusCode: 200,
      body: JSON.stringify(Attributes ? unmarshall(Attributes) : {}),
    };
  } catch (error) {
    console.error("Error in update-senkou:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error"}) };
  }
}
