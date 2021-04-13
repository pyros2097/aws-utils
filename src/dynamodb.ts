import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
  AttributeValue,
  PutItemCommand,
  ScanInput,
  QueryCommandInput,
  GetItemCommand,
  CreateTableCommand,
  KeySchemaElement,
  AttributeDefinition,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { SchemaOf } from 'yup';

export type Items<T> = {
  items: Array<T>;
  lastEvaluatedKey?: {
    [key: string]: AttributeValue;
  };
};

export class Table<T> {
  tableName: string;
  client: DynamoDBClient;
  schema: SchemaOf<T>;

  constructor({ name, schema }: { name: string, schema: SchemaOf<T> }) {
    this.tableName = name;
    this.client = new DynamoDBClient({});
    this.schema = schema;
  }

  createTable = async (params: { key: KeySchemaElement[], attributes: AttributeDefinition[] }) => {
    try {
      await this.client.send(new DescribeTableCommand({
        TableName: this.tableName,
      }))
    } catch (err) {
      await this.client.send(new CreateTableCommand({
        TableName: this.tableName,
        KeySchema: params.key,
        AttributeDefinitions: params.attributes,
        BillingMode: 'PAY_PER_REQUEST',
      }));
    }
  }

  scanAllItems = async (): Promise<Array<T>> => {
    const allItems: Array<T> = [];
    let lastEvaluatedKey: {} | undefined = {};
    let params: ScanInput = {
      TableName: this.tableName,
    };
    while (lastEvaluatedKey) {
      const res = await this.client.send(new ScanCommand(params));
      res.Items?.forEach(item => allItems.push(unmarshall(item) as T));
      lastEvaluatedKey = res.LastEvaluatedKey;
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }
    }
    return allItems;
  };

  scanItems = async (): Promise<Items<T>> => {
    const res = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );
    return {
      items: res.Items?.map(item => unmarshall(item) as T) || [],
      lastEvaluatedKey: res.LastEvaluatedKey,
    };
  };

  getItem = async (params: { [key: string]: any }): Promise<T | null> => {
    const res = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: marshall(params),
      })
    );
    return res.Item ? unmarshall(res.Item) as T : null;
  }

  queryItems = async (params: QueryCommandInput): Promise<Items<T>> => {
    const res = await this.client.send(
      new QueryCommand({
        ...params,
        TableName: this.tableName,
      })
    );
    return {
      items: res.Items?.map(item => unmarshall(item) as T) || [],
      lastEvaluatedKey: res.LastEvaluatedKey,
    };
  };

  putItem = async (params: T): Promise<T> => {
    await this.schema.validate(params, { abortEarly: false });
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(params),
      })
    );
    return params;
  };
}
