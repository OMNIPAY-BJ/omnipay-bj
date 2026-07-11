import { numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { MONEY_PRECISION, MONEY_SCALE } from './constants';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: numeric('price', { precision: MONEY_PRECISION, scale: MONEY_SCALE, mode: 'string' }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
