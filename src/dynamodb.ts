import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
  AttributeValue,
  PutItemCommand,
  ScanInput,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { SchemaOf } from 'yup';
import { validate } from './utils';

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

  constructor(tableName: string, schema: SchemaOf<T>) {
    this.tableName = tableName;
    this.client = new DynamoDBClient({});
    this.schema = schema;
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
    validate<T>(this.schema, params)
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(params),
      })
    );
    return params;
  };
}
