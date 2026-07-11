import { Request, Response } from 'express';

export function createTransfer(req: Request, res: Response) {
  const { amount, recipientId, walletId } = req.body;
  return res.status(201).json({ status: 'queued', amount, recipientId, walletId, module: 'payments' });
}

export function listTransactions(_req: Request, res: Response) {
  return res.status(200).json({ items: [], receiptGeneration: 'enabled' });
}
