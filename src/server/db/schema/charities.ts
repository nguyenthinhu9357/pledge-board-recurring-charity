import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const charities = pgTable('charities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  stellarAddress: text('stellar_address').notNull(),
  category: text('category').notNull().default('general'),
  totalPledged: text('total_pledged').notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Charity = typeof charities.$inferSelect;
export type NewCharity = typeof charities.$inferInsert;
