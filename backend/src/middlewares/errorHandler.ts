import { NextFunction, Request, Response } from 'express';

export function notFound(_req: Request, res: Response) {
  return res.status(404).json({ message: 'Route introuvable' });
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error('[api-error]', error);
  const message = process.env.NODE_ENV === 'production' ? 'Erreur serveur' : error.message;
  return res.status(500).json({ message });
}
