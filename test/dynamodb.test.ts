import * as yup from 'yup';
import { Table } from '../src/dynamodb';
import * as DynamoDbLocal from 'dynamodb-local';

const table = new Table({
  name: 'user',
  schema: yup.object({
    id: yup.string(),
    name: yup.string().required(),
    place: yup.string().required(),
  })
});

describe('dynamodb', () => {
  beforeAll(async () => {
    await DynamoDbLocal.launch(8000, null)
    await table.createTable({
      key: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      attributes: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ],
    })
  })

  afterAll(async () => {
    await DynamoDbLocal.stop(8000);
  })

  it('putItem', async () => {
    expect(table.putItem({ id: '123' } as any)).rejects.toThrow('2 errors occurred');
    expect(table.putItem({ id: '123', name: '123' } as any)).rejects.toThrow('place is a required field');
    expect(table.putItem({ name: '123', place: '123' } as any)).rejects.toThrow('One or more parameter values were invalid: Missing the key id in the item')
    const data = await table.putItem({
      id: '123',
      name: '123',
      place: '123',
    });
    expect(data.id).toEqual('123');
    expect(data.name).toEqual('123');
  });

  it('getItem', async () => {
    const data = await table.getItem({ id: '123' })
    expect(data).toBeDefined();
    expect(data?.id).toEqual('123');
    expect(data?.name).toEqual('123');
  })

  it('scanAllItems', async () => {
    const data = await table.scanAllItems()
    expect(data).toMatchObject([
      {
        id: '123',
        name: '123',
        place: '123',
      }
    ]);
  })

  it('scanItems', async () => {
    const data = await table.scanItems()
    expect(data).toMatchObject({
      "items": [{ "id": "123", "name": "123", "place": "123" }],
      "lastEvaluatedKey": undefined
    });
  });

  it('queryItems', async () => {
    const data = await table.queryItems({
      TableName: '',
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':id': {
          S: '123',
        },
      },
      Limit: 1,
      ScanIndexForward: false,
    })
    expect(data).toMatchObject({
      "items": [{ "id": "123", "name": "123", "place": "123" }],
      "lastEvaluatedKey": undefined
    });
  });
});
