import type { SchemaOf } from 'yup';

export const validate = <T>(schema: SchemaOf<T>, data: any) => {
  try {
    schema.validateSync(data, { abortEarly: false });
  } catch (err) {
    throw { errors: err.inner.map((item: any) => ({ path: item.path, errors: item.errors[0].replace(item.path + ' ', '') })) };
  }
};