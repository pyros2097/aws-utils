import type { SchemaOf } from 'yup';

export type Errors = {
  errors: {
    [key: string]: string
  }
}

export const validate = <T>(schema: SchemaOf<T>, data: any): Errors | null => {
  try {
    schema.validateSync(data, { abortEarly: false });
    return null;
  } catch (err) {
    const errors = err.inner.reduce((acc: any, item: any) => {
      acc[item.path] = item.errors[0].replace(item.path + ' ', '');
      return acc;
    }, {})
    return {
      errors: errors,
    };
  }
};