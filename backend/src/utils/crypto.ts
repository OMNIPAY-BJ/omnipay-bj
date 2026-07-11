import crypto from 'crypto';
import { env } from '../config/env';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');

export function encryptSensitiveData(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}
