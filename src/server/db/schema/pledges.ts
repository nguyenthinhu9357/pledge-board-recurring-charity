import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { charities } from './charities';

export const pledgeStatusEnum = pgEnum('pledge_status', ['active', 'paused', 'cancelled']);
export const pledgeCadenceEnum = pgEnum('pledge_cadence', ['monthly', 'quarterly', 'annual']);

export const pledges = pgTable('pledges', {
  id: uuid('id').primaryKey().defaultRandom(),
  donorName: text('donor_name').notNull(),
  charityId: uuid('charity_id')
    .notNull()
    .references(() => charities.id, { onDelete: 'cascade' }),
  monthlyAmountUsdc: text('monthly_amount_usdc').notNull(),
  bondAmount: text('bond_amount').notNull().default('0'),
  cadence: pledgeCadenceEnum('cadence').notNull().default('monthly'),
  nextDue: timestamp('next_due').notNull(),
  fulfillmentCount: integer('fulfillment_count').notNull().default(0),
  status: pledgeStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Pledge = typeof pledges.$inferSelect;
export type NewPledge = typeof pledges.$inferInsert;
