import { Request, Response } from 'express';

export function listProducts(_req: Request, res: Response) {
  return res.status(200).json({ items: [], checkout: 'ready', module: 'ecommerce' });
}

export function createOrder(req: Request, res: Response) {
  return res.status(201).json({ status: 'created', order: req.body });
}
