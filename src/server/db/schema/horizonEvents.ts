import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const horizonEvents = pgTable('horizon_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  charityId: uuid('charity_id').notNull(),
  pledgeId: uuid('pledge_id'),
  eventType: text('event_type').notNull().default('payment'),
  amount: text('amount').notNull().default('0'),
  txHash: text('tx_hash').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type HorizonEvent = typeof horizonEvents.$inferSelect;
export type NewHorizonEvent = typeof horizonEvents.$inferInsert;
