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

export type Items = {
  items: Array<{ [key: string]: any }>;
  lastEvaluatedKey?: {
    [key: string]: AttributeValue;
  };
};

export class Table {
  tableName: string;
  client: DynamoDBClient;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.client = new DynamoDBClient({});
  }

  scanAllItems = async (): Promise<Array<any>> => {
    const allItems: Array<any> = [];
    let lastEvaluatedKey: {} | undefined = {};
    let params: ScanInput = {
      TableName: this.tableName,
    };
    while (lastEvaluatedKey) {
      const res = await this.client.send(new ScanCommand(params));
      res.Items?.forEach(item => allItems.push(unmarshall(item)));
      lastEvaluatedKey = res.LastEvaluatedKey;
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }
    }
    return allItems;
  };

  scanItems = async (): Promise<Items> => {
    const res = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );
    return {
      items: res.Items?.map(item => unmarshall(item)) || [],
      lastEvaluatedKey: res.LastEvaluatedKey,
    };
  };

  queryItems = async (params: QueryCommandInput): Promise<Items> => {
    const res = await this.client.send(
      new QueryCommand({
        ...params,
        TableName: this.tableName,
      })
    );
    return {
      items: res.Items?.map(item => unmarshall(item)) || [],
      lastEvaluatedKey: res.LastEvaluatedKey,
    };
  };

  putItem = async (params: Object) => {
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(params),
      })
    );
    return params;
  };
}
