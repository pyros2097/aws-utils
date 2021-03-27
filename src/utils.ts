import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  DynamoDBClient,
  ScanCommand,
  AttributeValue,
  PutItemCommand,
  ScanInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});

export type Items = {
  items: Array<{ [key: string]: any }>;
  lastKey?: {
    [key: string]: AttributeValue;
  };
};

export class Table {
  tableName: string;
  constructor(tableName: string) {
    this.tableName = tableName;
  }

  scanAllItems = async (): Promise<Array<any>> => {
    const allItems: Array<any> = [];
    let lastEvaluatedKey: {} | undefined = {};
    let params: ScanInput = {
      TableName: this.tableName,
    };
    while (lastEvaluatedKey) {
      const res = await dynamodb.send(new ScanCommand(params));
      res.Items?.forEach(item => allItems.push(unmarshall(item)));
      lastEvaluatedKey = res.LastEvaluatedKey;
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }
    }
    return allItems;
  };

  scanItems = async (): Promise<Items> => {
    const res = await dynamodb.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );
    return {
      items: res.Items?.map(item => unmarshall(item)) || [],
      lastKey: res.LastEvaluatedKey,
    };
  };

  putItem = async (params: Object) => {
    await dynamodb.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(params),
      })
    );
    return params;
  };
}

export class Bucket {
  bucketName: string;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }

  getObject = async (key: string): Promise<string> => {
    return await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );
  };

  putObject = async (key: string, body: Buffer): Promise<string> => {
    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
      })
    );
    return await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );
  };
}
