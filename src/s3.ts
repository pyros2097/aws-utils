import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class Bucket {
  bucketName: string;
  client: S3Client;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
    this.client = new S3Client({});
  }

  getObject = async (key: string): Promise<string> => {
    return await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );
  };

  putObject = async (key: string, body: Buffer): Promise<string> => {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
      })
    );
    return await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })
    );
  };
}
