import 'text-encoding-polyfill';
import { LambdaClient, InvokeCommand, LambdaClientConfig } from "@aws-sdk/client-lambda";

export class AWSError extends Error {
  trace: Array<string>
  constructor(name: string, message: string, trace: Array<string>) {
    super(message);
    this.name = name;
    this.trace = trace;
  }
}

export class LambadValidationError extends Error {
  errors: {
    [key: string]: string
  }
  constructor(errors: { [key: string]: string }) {
    super('ValidationError');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class Lambda {
  client: LambdaClient;
  stackName: string;
  getToken: () => Promise<string>;
  encoder = new TextEncoder();
  decoder = new TextDecoder();
  constructor({ stackName, config, getToken }: { stackName: string, config: LambdaClientConfig, getToken: () => Promise<string> }) {
    this.stackName = stackName;
    this.client = new LambdaClient(config);
    this.getToken = getToken;
  }

  async invoke<R>(fnName: string, params: any): Promise<R> {
    const res = await this.client.send(new InvokeCommand({
      FunctionName: `${this.stackName}-${fnName}`,
      Payload: this.encoder.encode(JSON.stringify({
        token: await this.getToken(),
        params: params,
      })),
      InvocationType: "RequestResponse",
      LogType: "None"
    }))
    if (!res.Payload) {
      throw new Error(`Function '${fnName}' didn't return a response `);
    }
    const data = JSON.parse(this.decoder.decode(res.Payload));
    if (data && data.errorType) {
      if (data.errorType === 'ValidationError') {
        const errors = JSON.parse(data.errorMessage);
        throw new LambadValidationError(errors);
      } else {
        throw new AWSError(data.errorType, data.errorMessage, data.trace);
      }
    }
    return data as R;
  }
}