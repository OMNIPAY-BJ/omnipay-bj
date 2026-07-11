import { Request, Response } from 'express';

export function getFinancialDashboard(_req: Request, res: Response) {
  return res.status(200).json({ budgets: [], savingsGoals: [], reports: [], alerts: [] });
}
