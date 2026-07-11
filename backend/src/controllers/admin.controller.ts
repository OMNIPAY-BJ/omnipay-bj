import { desc, sql } from 'drizzle-orm';
import { Response } from 'express';
import { db } from '../db';
import { adminLogs, transactions, users } from '../db/schema';
import { AuthenticatedRequest } from '../middlewares/auth';

export async function getAdminOverview(req: AuthenticatedRequest, res: Response) {
  try {
    const actor = req.user?.id
      ? await db.query.users.findFirst({
          where: (user, { eq }) => eq(user.id, req.user!.id)
        })
      : null;

    await db.insert(adminLogs).values({
      action: 'view_overview',
      userId: actor?.id ?? null
    });

    const [{ count: userCount }] = await db.select({ count: sql<string>`count(*)` }).from(users);
    const [{ count: transactionCount }] = await db
      .select({ count: sql<string>`count(*)` })
      .from(transactions);
    const recentLogs = await db.select().from(adminLogs).orderBy(desc(adminLogs.timestamp)).limit(10);

    return res.status(200).json({
      users: Number(userCount),
      transactions: Number(transactionCount),
      complianceFlags: recentLogs.filter((log) => log.action.includes('compliance')).length,
      settings: {},
      recentLogs
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[admin-overview]', error);
    return res.status(500).json({ message: 'Impossible de récupérer la vue administrateur.' });
  }
}
