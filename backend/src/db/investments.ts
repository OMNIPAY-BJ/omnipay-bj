import { integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { MONEY_PRECISION, MONEY_SCALE } from './constants';
import { users } from './users';

export const investments = pgTable('investments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  assetName: varchar('asset_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  purchasePrice: numeric('purchase_price', {
    precision: MONEY_PRECISION,
    scale: MONEY_SCALE,
    mode: 'string'
  }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
