import {
  users,
  type User,
  type InsertUser,
  invoices,
  type Invoice,
  type InsertInvoice,
  discountOffers,
  type DiscountOffer,
  type InsertDiscountOffer,
  autoApprovalSettings,
  type AutoApprovalSettings,
  type InsertAutoApprovalSettings,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Invoice methods
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesBySupplier(supplierId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice>;
  
  // Discount offer methods
  getDiscountOffer(id: number): Promise<DiscountOffer | undefined>;
  getPendingDiscountOffers(): Promise<DiscountOffer[]>;
  getAcceptedDiscountOffers(): Promise<DiscountOffer[]>;
  getDiscountOffersBySupplierId(supplierId: string): Promise<DiscountOffer[]>;
  createDiscountOffer(offer: InsertDiscountOffer): Promise<DiscountOffer>;
  updateDiscountOfferStatus(id: number, status: string): Promise<DiscountOffer>;
  
  // Auto approval settings methods
  getAutoApprovalSettings(userId: string): Promise<AutoApprovalSettings | undefined>;
  upsertAutoApprovalSettings(settings: InsertAutoApprovalSettings): Promise<AutoApprovalSettings>;
  
  // Utility methods
  getUniqueBuyers(): Promise<string[]>;
  getUniqueSuppliers(): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { db } = await import('./db');
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const { db } = await import('./db');
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoicesBySupplier(supplierId: string): Promise<Invoice[]> {
    const { db } = await import('./db');
    return await db.select().from(invoices).where(eq(invoices.supplierId, supplierId));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const { db } = await import('./db');
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    const { db } = await import('./db');
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    
    if (!updatedInvoice) {
      throw new Error(`Invoice with ID ${id} not found`);
    }
    
    return updatedInvoice;
  }

  // Discount offer methods
  async getDiscountOffer(id: number): Promise<DiscountOffer | undefined> {
    const { db } = await import('./db');
    const [offer] = await db.select().from(discountOffers).where(eq(discountOffers.id, id));
    return offer;
  }

  async getPendingDiscountOffers(): Promise<DiscountOffer[]> {
    const { db } = await import('./db');
    return await db.select().from(discountOffers).where(eq(discountOffers.status, "pending"));
  }

  async getAcceptedDiscountOffers(): Promise<DiscountOffer[]> {
    const { db } = await import('./db');
    return await db.select().from(discountOffers).where(eq(discountOffers.status, "accepted"));
  }

  async getDiscountOffersBySupplierId(supplierId: string): Promise<DiscountOffer[]> {
    const { db } = await import('./db');
    return await db.select().from(discountOffers).where(eq(discountOffers.supplierId, supplierId));
  }

  async createDiscountOffer(insertOffer: InsertDiscountOffer): Promise<DiscountOffer> {
    const { db } = await import('./db');
    const [offer] = await db.insert(discountOffers).values(insertOffer).returning();
    return offer;
  }

  async updateDiscountOfferStatus(id: number, status: string): Promise<DiscountOffer> {
    const { db } = await import('./db');
    const [updatedOffer] = await db
      .update(discountOffers)
      .set({ status })
      .where(eq(discountOffers.id, id))
      .returning();
    
    if (!updatedOffer) {
      throw new Error(`Discount offer with ID ${id} not found`);
    }
    
    return updatedOffer;
  }

  // Auto approval settings methods
  async getAutoApprovalSettings(userId: string): Promise<AutoApprovalSettings | undefined> {
    const { db } = await import('./db');
    const [settings] = await db
      .select()
      .from(autoApprovalSettings)
      .where(eq(autoApprovalSettings.userId, userId));
    return settings;
  }

  async upsertAutoApprovalSettings(insertSettings: InsertAutoApprovalSettings): Promise<AutoApprovalSettings> {
    const { db } = await import('./db');
    const existingSettings = await this.getAutoApprovalSettings(insertSettings.userId);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(autoApprovalSettings)
        .set({
          ...insertSettings,
          updatedAt: new Date(),
        })
        .where(eq(autoApprovalSettings.id, existingSettings.id))
        .returning();
      
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(autoApprovalSettings)
        .values({
          ...insertSettings,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return newSettings;
    }
  }

  // Utility methods
  async getUniqueBuyers(): Promise<string[]> {
    const { db } = await import('./db');
    const result = await db.selectDistinct({ buyerName: invoices.buyerName }).from(invoices);
    return result.map(r => r.buyerName);
  }

  async getUniqueSuppliers(): Promise<string[]> {
    const { db } = await import('./db');
    const result = await db.selectDistinct({ supplierName: discountOffers.supplierName }).from(discountOffers);
    return result.map(r => r.supplierName);
  }
}

// Add some initial seed data for development
async function seedDatabase() {
  const { db } = await import('./db');
  
  // Check if there is already data in the users table
  const existingUsers = await db.select().from(users).limit(1);
  
  if (existingUsers.length === 0) {
    console.log('Seeding database with initial data...');
    
    // Add sample users
    await db.insert(users).values([
      {
        id: "supplier1",
        email: "supplier@example.com",
        role: "supplier",
        username: "supplier1",
      },
      {
        id: "buyer1",
        email: "buyer@example.com",
        role: "buyer",
        username: "buyer1",
      }
    ]);
    
    // Add sample invoices
    const invoiceResult = await db.insert(invoices).values([
      {
        invoiceId: "INV-001234",
        invoiceAmount: 123456,
        invoiceDate: "15/06/2023",
        dueDate: "15/08/2023",
        buyerName: "Acme Corp",
        status: "pending",
        supplierId: "supplier1",
        buyerId: "buyer1",
      },
      {
        invoiceId: "INV-001235",
        invoiceAmount: 245670,
        invoiceDate: "20/06/2023",
        dueDate: "20/08/2023",
        buyerName: "Globex",
        status: "pending",
        supplierId: "supplier1",
        buyerId: "buyer1",
      },
      {
        invoiceId: "INV-001236",
        invoiceAmount: 378900,
        invoiceDate: "05/06/2023",
        dueDate: "05/08/2023",
        buyerName: "Acme Corp",
        status: "completed",
        supplierId: "supplier1",
        buyerId: "buyer1",
      }
    ]).returning();
    
    // Add sample discount offer
    await db.insert(discountOffers).values([
      {
        invoiceId: String(invoiceResult[2].id), // Convert to string
        originalAmount: 378900,
        discountRate: 2.5,
        discountedAmount: 369427.5,
        discountValue: 9472.5,
        earlyPaymentDate: "20/07/2023",
        dcfValue: 365000,
        status: "accepted",
        supplierId: "supplier1",
        supplierName: "Supplier Company",
      }
    ]);
    
    console.log('Database seeded successfully');
  }
}

// Initialize the storage
export const storage = new DatabaseStorage();

// Seed the database with initial data
seedDatabase().catch(console.error);
