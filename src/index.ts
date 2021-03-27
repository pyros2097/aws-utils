import { validateSync } from 'class-validator';
import { ClassConstructor, plainToClass } from 'class-transformer';
import { getToken } from './jwt';

export { getToken };

export type FunctionCall = {
  schema?: any;
  handler: (ctx: Context, params: Object) => Promise<any>;
};
type FunctionCallMap = { [key: string]: FunctionCall };

export const funcMap: FunctionCallMap = {};

export type Context = {
  userId: string;
  timestamp: Date;
};

type EventBody = {
  fnName: string;
  params: Object;
};

export const handler = async (event: {
  headers: any;
  body: string;
}): Promise<any> => {
  if (!event.headers.Authorization) {
    return { error: 'You need to pass the authorization token' };
  }
  if (!event.body) {
    return { error: 'You need to pass the right function method' };
  }
  try {
    const context = { userId: '', timestamp: new Date() };
    const body: EventBody = JSON.parse(event.body);
    try {
      const token = await getToken(event.headers.Authorization);
      context.userId = token.sub;
    } catch (err) {
      return { error: 'The authorization token is invalid' };
    }
    // 'You are not authorized to view/perform this section/action'
    const fn = funcMap[body.fnName];
    if (!fn) {
      return { error: 'You need to pass the right function method' };
    }
    if (fn.schema) {
      const errors = validateObject(fn.schema, body.params);
      if (errors) {
        return { errors };
      }
    }
    return await fn.handler(context, body.params);
  } catch (err) {
    return { error: err.message };
  }
};

const createError = (constraints: { [type: string]: string }) =>
  Object.keys(constraints)
    .map(key => constraints[key])
    .join(', ');

export const validate = (cls: any): Object | null => {
  const errors = validateSync(cls, { validationError: { target: false } });
  const allErrors: any = {};
  errors.forEach(item => {
    if (item.children && item.children.length > 0) {
      allErrors[item.property] = {};
      item.children.forEach(subItem => {
        allErrors[item.property][subItem.property] = createError(
          subItem.constraints || {}
        );
      });
    } else {
      allErrors[item.property] = createError(item.constraints || {});
    }
  });
  if (Object.keys(allErrors).length === 0) {
    return null;
  }
  return allErrors;
};

export const validateObject = <T, V>(cls: ClassConstructor<T>, obj: V) => {
  const c = plainToClass<T, V>(cls, obj);
  return validate(c);
};
