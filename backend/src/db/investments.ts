import { integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const investments = pgTable('investments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  assetName: varchar('asset_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  purchasePrice: numeric('purchase_price', { precision: 12, scale: 2, mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
