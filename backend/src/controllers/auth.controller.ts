import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { db } from '../db';
import { users } from '../db/schema';

export async function signup(req: Request, res: Response) {
  try {
    const { email, password, twoFactorCode, kycReference } = req.body;
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Un compte existe déjà pour cet email.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [createdUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        twoFactorCode,
        kycReference
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      });

    return res.status(201).json({
      message: 'Compte créé.',
      user: createdUser
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[auth-signup]', error);
    return res.status(500).json({ message: 'Impossible de créer le compte.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN
    });

    return res.status(200).json({
      token,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[auth-login]', error);
    return res.status(500).json({ message: 'Impossible de se connecter.' });
  }
}
