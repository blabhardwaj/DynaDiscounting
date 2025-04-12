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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private invoices: Map<number, Invoice>;
  private discountOffers: Map<number, DiscountOffer>;
  private autoApprovalSettings: Map<string, AutoApprovalSettings>;
  private nextInvoiceId: number;
  private nextOfferId: number;
  private nextSettingsId: number;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.discountOffers = new Map();
    this.autoApprovalSettings = new Map();
    this.nextInvoiceId = 1;
    this.nextOfferId = 1;
    this.nextSettingsId = 1;
    
    // Add some sample data
    this.seedData();
  }

  // Seed some initial data for testing
  private seedData() {
    // Add sample users
    const supplierUser: User = {
      id: "supplier1",
      email: "supplier@example.com",
      role: "supplier",
      username: "supplier1",
    };
    
    const buyerUser: User = {
      id: "buyer1",
      email: "buyer@example.com",
      role: "buyer",
      username: "buyer1",
    };
    
    this.users.set(supplierUser.id, supplierUser);
    this.users.set(buyerUser.id, buyerUser);
    
    // Add sample invoices
    const sampleInvoices: InsertInvoice[] = [
      {
        invoiceId: "INV-001234",
        invoiceAmount: 123456,
        invoiceDate: "15/06/2023",
        dueDate: "15/08/2023",
        buyerName: "Acme Corp",
        status: "pending",
        supplierId: "supplier1",
      },
      {
        invoiceId: "INV-001235",
        invoiceAmount: 245670,
        invoiceDate: "20/06/2023",
        dueDate: "20/08/2023",
        buyerName: "Globex",
        status: "pending",
        supplierId: "supplier1",
      },
      {
        invoiceId: "INV-001236",
        invoiceAmount: 378900,
        invoiceDate: "05/06/2023",
        dueDate: "05/08/2023",
        buyerName: "Acme Corp",
        status: "completed",
        supplierId: "supplier1",
      },
    ];
    
    sampleInvoices.forEach(invoice => {
      const id = this.nextInvoiceId++;
      this.invoices.set(id, {
        ...invoice,
        id,
        createdAt: new Date().toISOString(),
      });
    });
    
    // Add sample discount offers
    const sampleOffers: InsertDiscountOffer[] = [
      {
        invoiceId: 3, // The completed invoice
        originalAmount: 378900,
        discountRate: 2.5,
        discountedAmount: 369427.5,
        discountValue: 9472.5,
        earlyPaymentDate: "20/07/2023",
        dcfValue: 365000,
        status: "accepted",
        supplierId: "supplier1",
        supplierName: "Supplier Company",
      },
    ];
    
    sampleOffers.forEach(offer => {
      const id = this.nextOfferId++;
      this.discountOffers.set(id, {
        ...offer,
        id,
        createdAt: new Date().toISOString(),
      });
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { ...insertUser };
    this.users.set(user.id, user);
    return user;
  }

  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoicesBySupplier(supplierId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.supplierId === supplierId,
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.nextInvoiceId++;
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      createdAt: new Date().toISOString(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) {
      throw new Error(`Invoice with ID ${id} not found`);
    }
    
    const updatedInvoice = { ...invoice, ...updates };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  // Discount offer methods
  async getDiscountOffer(id: number): Promise<DiscountOffer | undefined> {
    return this.discountOffers.get(id);
  }

  async getPendingDiscountOffers(): Promise<DiscountOffer[]> {
    return Array.from(this.discountOffers.values()).filter(
      (offer) => offer.status === "pending",
    );
  }

  async getAcceptedDiscountOffers(): Promise<DiscountOffer[]> {
    return Array.from(this.discountOffers.values()).filter(
      (offer) => offer.status === "accepted",
    );
  }

  async getDiscountOffersBySupplierId(supplierId: string): Promise<DiscountOffer[]> {
    return Array.from(this.discountOffers.values()).filter(
      (offer) => offer.supplierId === supplierId,
    );
  }

  async createDiscountOffer(insertOffer: InsertDiscountOffer): Promise<DiscountOffer> {
    const id = this.nextOfferId++;
    const offer: DiscountOffer = {
      ...insertOffer,
      id,
      createdAt: new Date().toISOString(),
    };
    this.discountOffers.set(id, offer);
    return offer;
  }

  async updateDiscountOfferStatus(id: number, status: string): Promise<DiscountOffer> {
    const offer = this.discountOffers.get(id);
    if (!offer) {
      throw new Error(`Discount offer with ID ${id} not found`);
    }
    
    const updatedOffer = { ...offer, status };
    this.discountOffers.set(id, updatedOffer);
    return updatedOffer;
  }

  // Auto approval settings methods
  async getAutoApprovalSettings(userId: string): Promise<AutoApprovalSettings | undefined> {
    return Array.from(this.autoApprovalSettings.values()).find(
      (settings) => settings.userId === userId,
    );
  }

  async upsertAutoApprovalSettings(insertSettings: InsertAutoApprovalSettings): Promise<AutoApprovalSettings> {
    // Check if settings already exist for this user
    const existingSettings = await this.getAutoApprovalSettings(insertSettings.userId);
    
    if (existingSettings) {
      // Update existing settings
      const updatedSettings = {
        ...existingSettings,
        ...insertSettings,
        updatedAt: new Date().toISOString(),
      };
      this.autoApprovalSettings.set(existingSettings.id, updatedSettings);
      return updatedSettings;
    } else {
      // Create new settings
      const id = this.nextSettingsId++;
      const settings: AutoApprovalSettings = {
        ...insertSettings,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.autoApprovalSettings.set(id, settings);
      return settings;
    }
  }

  // Utility methods
  async getUniqueBuyers(): Promise<string[]> {
    const buyers = new Set<string>();
    
    this.invoices.forEach((invoice) => {
      buyers.add(invoice.buyerName);
    });
    
    return Array.from(buyers);
  }

  async getUniqueSuppliers(): Promise<string[]> {
    const suppliers = new Set<string>();
    
    this.discountOffers.forEach((offer) => {
      suppliers.add(offer.supplierName);
    });
    
    return Array.from(suppliers);
  }
}

export const storage = new MemStorage();
