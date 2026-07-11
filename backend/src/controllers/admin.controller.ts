import { Request, Response } from 'express';

export function getAdminOverview(_req: Request, res: Response) {
  return res.status(200).json({ users: 0, transactions: 0, complianceFlags: 0, settings: {} });
}
