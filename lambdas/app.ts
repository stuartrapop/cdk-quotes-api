import { APIGatewayEvent, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const MY_TABLE = process.env.MY_TABLE;
const dynamo = new DynamoDB.DocumentClient();

const listQuotes = () => {
  const params = {
    TableName: MY_TABLE!,
  };
  return dynamo
    .scan(params)
    .promise()
    .then((data) => {
      return data.Items;
    });
};

const deleteQuote = (id: string) => {
  const params = {
    TableName: MY_TABLE!,
    Key: {
      id,
    },
  };
  return dynamo
    .delete(params)
    .promise()
    .then(() => {
      return id;
    });
};

const getQuote = (id: string) => {
  const params = {
    TableName: MY_TABLE!,
    Key: {
      id,
    },
  };
  return dynamo
    .get(params)
    .promise()
    .then((item) => {
      return item;
    });
};

const updateQuote = (id: string, data: { quote: string; author: string }) => {
  const datetime = new Date().toISOString();
  const quote = {
    quote: data.quote,
    author: data.author,
  };

  const params = {
    TableName: MY_TABLE!,
    Key: {
      id,
    },
    ReturnValues: 'UPDATED_NEW',
    UpdateExpression:
      'set quote = :quote, author = :author, updatedAt = :updatedAt',
    // This expression is what updates the item attribute
    ExpressionAttributeValues: {
      ':quote': data.quote,
      ':author': data.author,
      ':updatedAt': datetime,
      //create an Expression Attribute Value to pass in the expression above
    },

    Item: quote,
  };
  return dynamo
    .update(params)
    .promise()
    .then(() => {
      return quote;
    });
};

export const handler = async (event: APIGatewayEvent, context: Context) => {
  console.log('Event::::', event);

  let path = event.resource;
  let httpMethod = event.httpMethod;
  let route = httpMethod.concat(' ').concat(path);

  let data = JSON.parse(event.body!);
  let body;
  let statusCode = 200;

  try {
    switch (route) {
      case 'GET /quotes':
        body = await listQuotes();
        break;

      case 'POST /quotes':
        body = await saveQuote(data);
        break;
      case 'DELETE /quotes/{id}':
        console.log(event.pathParameters);
        body = await deleteQuote(event.pathParameters!.id!);
        break;
      case 'PUT /quotes/{id}':
        body = await updateQuote(event.pathParameters!.id!, data);
        break;
      case 'GET /quotes/{id}':
        body = await getQuote(event.pathParameters!.id!);
        break;
      default:
        throw new Error('Unsupported route');
    }
  } catch (error: any) {
    console.log(error);
    statusCode = 400;
    body = error.message;
  } finally {
    console.log(body);
    body = JSON.stringify(body);
  }

  return sendRes(statusCode, body);
};

const sendRes = (status: number, body: string) => {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  };
};

const saveQuote = async (data: { quote: string; author: string }) => {
  const date = new Date();
  const time = date.getTime();

  const quote = {
    id: time.toString(),
    quote: data.quote,
    author: data.author,
  };

  const params = {
    TableName: MY_TABLE!,
    Item: quote,
  };
  return dynamo
    .put(params)
    .promise()
    .then(() => {
      return quote;
    });
};
