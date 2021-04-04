import * as yup from 'yup';
import { validate } from '../src/utils';

const name = yup.object({
  firstName: yup.string().required(),
  middleName: yup.string(),
  lastName: yup.string().required(),
});

const schema = yup.object({
  me: name,
  status: yup.string().oneOf(['neutral', 'happy', 'sad']).required(),
});

describe('utils', () => {
  it('validate', async () => {
    expect(validate(schema, {})).toMatchObject({
      errors: {
        'me.firstName': 'is a required field',
        'me.lastName': 'is a required field',
        status: 'is a required field'
      }
    })
  });
});
