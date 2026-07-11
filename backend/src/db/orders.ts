import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { products } from './products';
import { users } from './users';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  status: varchar('status', { length: 32 }).notNull().default('created'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
