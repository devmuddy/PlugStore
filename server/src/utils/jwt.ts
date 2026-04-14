import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE: SignOptions['expiresIn'] = (process.env.JWT_EXPIRE as SignOptions['expiresIn']) || '7d';

export interface TokenPayload {
  id: string;
  email: string;
  role: 'user' | 'admin';
  sessionToken: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
