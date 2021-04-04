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
    return { errors: err.inner.map((item: any) => ({ path: item.path, errors: item.errors[0].replace(item.path + ' ', '') })) };
  }
};