# atoms

[![Version](https://img.shields.io/npm/v/atoms-utils?style=flat-square&color=blue)](https://www.npmjs.com/package/atoms-utils)

A common aws utils library for react-native and nodejs

```sh
npm i atoms-utils
```

## Usage

```js
const yup = require('yup');
const { getToken } = require('atoms-utils/dynamodb');
const { Table } = require('atoms-utils/dynamodb');
const { Bucket } = require('atoms-utils/s3');

const UserTable = new Table({
  name: process.env.STACK_NAME + '.user',
  schema: yup.object({
    id: yup
      .string()
      .uuid()
      .required(),
    name: yup.string().required(),
    createdAt: yup.number().required(),
  }),
});

const ImageBucket = new Bucket(process.env.STACK_NAME + '.images');

process.env.USER_POOL = '123';
process.env.AWS_REGION = '123';

const main = async () => {
  await getToken();
  await UserTable.putIem({
    id: '123',
    name: '123',
    createdAt: 0,
  });
  await ImageBucket.putObject('123', Buffer.from('prfilepic', 'base64'));
};

main();
```
