import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config';
import type { JwtPayload } from '../types';

export const signAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

/** @deprecated Use signAccessToken */
export const signToken = signAccessToken;

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
