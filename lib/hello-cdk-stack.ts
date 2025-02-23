import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { IResource, LambdaIntegration, MockIntegration, RestApi, PassthroughBehavior } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Function, AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB 定義
    const dynamoTable = new Table(this, "senkous", {
      partitionKey: {
        name: "senkouId",
        type: AttributeType.STRING, // ✅ PK を senkouId に変更
      },
      tableName: "senkous",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 本番環境では変更するべき
    });

    // 共通の Lambda 設定
    const lambdaProps = {
      code: new AssetCode("lib/lambda"),
      runtime: Runtime.NODEJS_22_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        REGION: this.region,
      },
    };

    // Lambda 関数定義
    const createSenkouLambda = new Function(this, "createSenkouFunction", {
      ...lambdaProps,
      handler: "create-senkou.handler",
    });

    const getSenkouLambda = new Function(this, "getSenkouFunction", {
      ...lambdaProps,
      handler: "get-senkou.handler",
    });

    const getSenkouListLambda = new Function(this, "getSenkouListFunction", {
      ...lambdaProps,
      handler: "get-senkou-list.handler",
    });

    const updateSenkouLambda = new Function(this, "updateSenkouFunction", {
      ...lambdaProps,
      handler: "update-senkou.handler",
    });

    const deleteSenkouLambda = new Function(this, "deleteSenkouFunction", {
      ...lambdaProps,
      handler: "delete-senkou.handler",
    });

    // DynamoDB へのアクセス権を Lambda に付与
    dynamoTable.grantReadWriteData(createSenkouLambda);
    dynamoTable.grantReadData(getSenkouLambda);
    dynamoTable.grantReadData(getSenkouListLambda);
    dynamoTable.grantReadWriteData(updateSenkouLambda);
    dynamoTable.grantWriteData(deleteSenkouLambda);

    // API Gateway 定義
    const api = new RestApi(this, "sampleApi", {
      restApiName: "Sample API",
    });

    // senkous エンドポイント
    const senkous = api.root.addResource("senkous");

    // 一覧取得（userId をクエリパラメータで指定）
    senkous.addMethod("GET", new LambdaIntegration(getSenkouListLambda));

    // 個別取得、更新、削除
    const singleSenkou = senkous.addResource("{senkouId}");
    singleSenkou.addMethod("GET", new LambdaIntegration(getSenkouLambda)); // 取得
    singleSenkou.addMethod("PUT", new LambdaIntegration(updateSenkouLambda)); // 更新
    singleSenkou.addMethod("DELETE", new LambdaIntegration(deleteSenkouLambda)); // 削除

    senkous.addMethod("POST", new LambdaIntegration(createSenkouLambda)); // 作成

    addCorsOptions(senkous);
  }
}

// CORS 設定を追加
export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials": "'false'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    }
  );
}

const app = new cdk.App();
new HelloCdkStack(app, "HelloCdkStack");
app.synth();
