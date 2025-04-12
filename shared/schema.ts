import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  role: text("role").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  username: true,
  role: true,
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  invoiceAmount: doublePrecision("invoice_amount").notNull(),
  invoiceDate: text("invoice_date").notNull(),
  dueDate: text("due_date").notNull(),
  buyerName: text("buyer_name").notNull(),
  status: text("status").notNull().default("pending"),
  supplierId: text("supplier_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

// Discount offers table
export const discountOffers = pgTable("discount_offers", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  originalAmount: doublePrecision("original_amount").notNull(),
  discountRate: doublePrecision("discount_rate").notNull(),
  discountedAmount: doublePrecision("discounted_amount").notNull(),
  discountValue: doublePrecision("discount_value").notNull(),
  earlyPaymentDate: text("early_payment_date").notNull(),
  dcfValue: doublePrecision("dcf_value").notNull(),
  status: text("status").notNull().default("pending"),
  supplierId: text("supplier_id").notNull().references(() => users.id),
  supplierName: text("supplier_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDiscountOfferSchema = createInsertSchema(discountOffers).omit({
  id: true,
  createdAt: true,
});

// Auto Approval Settings table
export const autoApprovalSettings = pgTable("auto_approval_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  enabled: boolean("enabled").notNull().default(false),
  maxDiscountRate: doublePrecision("max_discount_rate").notNull(),
  maxAmount: doublePrecision("max_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAutoApprovalSettingsSchema = createInsertSchema(autoApprovalSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertDiscountOffer = z.infer<typeof insertDiscountOfferSchema>;
export type DiscountOffer = typeof discountOffers.$inferSelect;

export type InsertAutoApprovalSettings = z.infer<typeof insertAutoApprovalSettingsSchema>;
export type AutoApprovalSettings = typeof autoApprovalSettings.$inferSelect;
