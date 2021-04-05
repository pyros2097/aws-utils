import type { SchemaOf } from 'yup';

export class ValidationError extends Error {
  constructor(errors: { [key: string]: string }) {
    super(JSON.stringify(errors));
    this.name = 'ValidationError';
  }
}

export const validate = <T>(schema: SchemaOf<T>, data: any) => {
  try {
    schema.validateSync(data, { abortEarly: false });
  } catch (err) {
    const errors = err.inner.reduce((acc: any, item: any) => {
      acc[item.path] = item.errors[0].replace(item.path + ' ', '');
      return acc;
    }, {})
    throw new ValidationError(errors);
  }
};