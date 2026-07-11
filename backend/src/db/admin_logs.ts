import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const adminLogs = pgTable('admin_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: varchar('action', { length: 255 }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
});
