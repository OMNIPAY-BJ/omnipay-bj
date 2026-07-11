import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { env } from '../config/env';

export async function signup(req: Request, res: Response) {
  const { email, password, twoFactorCode, kycReference } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);

  return res.status(201).json({
    message: 'Compte créé (stub).',
    user: { email, passwordHash, twoFactorCodeVerified: Boolean(twoFactorCode), kycReference }
  });
}

export function login(req: Request, res: Response) {
  const { userId = 'demo-user', role = 'customer' } = req.body;

  const token = jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN
  });

  return res.status(200).json({ token, tokenType: 'Bearer' });
}
