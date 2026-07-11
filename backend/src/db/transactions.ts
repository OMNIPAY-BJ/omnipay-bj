import { numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { MONEY_PRECISION, MONEY_SCALE } from './constants';
import { users } from './users';

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: MONEY_PRECISION, scale: MONEY_SCALE, mode: 'string' }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('queued'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
