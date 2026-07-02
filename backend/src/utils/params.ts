import { ApiError } from './ApiError';

export const getParam = (
  params: Record<string, string | string[] | undefined>,
  key: string,
): string => {
  const value = params[key];

  if (typeof value === 'string') {
    return value;
  }

  throw new ApiError(400, `Invalid route parameter: ${key}`);
};
