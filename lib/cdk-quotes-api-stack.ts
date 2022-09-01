import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';

export class CdkQuotesApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'quotes-tbl', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const handlerFunction = new NodejsFunction(this, 'quotesHandler', {
      runtime: Runtime.NODEJS_14_X,
      //  code: Code.fromAsset(join(__dirname, '../lambdas')),
      handler: 'handler',
      entry: join(__dirname, `/../lambdas/app.ts`),
      functionName: 'LambdaQuotesNew',
      environment: {
        MY_TABLE: table.tableName,
      },
    });

    //grant permission
    table.grantReadWriteData(handlerFunction);

    const api = new RestApi(this, 'quotes-api', {
      description: 'Quotes Api',
    });

    const handlerIntegration = new LambdaIntegration(handlerFunction);

    const mainPath = api.root.addResource('quotes');
    const idPath = mainPath.addResource('{id}');
    mainPath.addMethod('GET', handlerIntegration);
    mainPath.addMethod('POST', handlerIntegration);
    idPath.addMethod('DELETE', handlerIntegration);
    idPath.addMethod('GET', handlerIntegration);
    idPath.addMethod('PUT', handlerIntegration);
  }
}
