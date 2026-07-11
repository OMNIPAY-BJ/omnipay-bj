import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

const BEARER_PREFIX = 'Bearer ';

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith(BEARER_PREFIX) || authorization.length <= BEARER_PREFIX.length) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  const token = authorization.slice(BEARER_PREFIX.length).trim();
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Token invalide' });
  }
}
