import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../constants/auth';

export function extractAccessToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return undefined;
}
