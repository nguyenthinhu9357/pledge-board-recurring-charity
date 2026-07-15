import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pledges } from './pledges';

export const fulfillments = pgTable('fulfillments', {
  id: uuid('id').primaryKey().defaultRandom(),
  pledgeId: uuid('pledge_id')
    .notNull()
    .references(() => pledges.id, { onDelete: 'cascade' }),
  amountUsdc: text('amount_usdc').notNull(),
  txHash: text('tx_hash').notNull().default(''),
  cycleLabel: text('cycle_label').notNull(),
  fulfilledAt: timestamp('fulfilled_at').notNull().defaultNow(),
});

export type Fulfillment = typeof fulfillments.$inferSelect;
export type NewFulfillment = typeof fulfillments.$inferInsert;
