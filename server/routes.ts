import express, { type Express } from "express";
import type { Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertInvoiceSchema,
  insertDiscountOfferSchema,
  insertAutoApprovalSettingsSchema,
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { addBusinessDays, getDaysBetweenDates, parseDate } from "../client/src/lib/utils";

// Mock data for charts (in a real app, this would come from the database)
const supplierChartData = [
  { name: "Jan", value: 24000, accepted: 18000 },
  { name: "Feb", value: 32000, accepted: 24500 },
  { name: "Mar", value: 28000, accepted: 21000 },
  { name: "Apr", value: 40000, accepted: 32000 },
  { name: "May", value: 49000, accepted: 38000 },
  { name: "Jun", value: 42000, accepted: 36000 },
  { name: "Jul", value: 56000, accepted: 45000 },
];

const buyerChartData = [
  { name: "Jan", value: 42000, savings: 3360 },
  { name: "Feb", value: 38000, savings: 2660 },
  { name: "Mar", value: 65000, savings: 4550 },
  { name: "Apr", value: 48000, savings: 3120 },
  { name: "May", value: 74000, savings: 5180 },
  { name: "Jun", value: 52000, savings: 3380 },
  { name: "Jul", value: 69000, savings: 4830 },
];

// Utility function to handle validation errors
const validateRequest = <T>(schema: z.ZodType<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(fromZodError(error).message);
    }
    throw error;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // API routes
  // Get all invoices for a supplier
  router.get("/invoices", async (req: Request, res: Response) => {
    try {
      const supplierId = req.query.supplierId as string | undefined;
      if (!supplierId) {
        return res.status(400).json({ message: "Supplier ID is required" });
      }
      
      const invoices = await storage.getInvoicesBySupplier(supplierId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Upload invoices
  router.post("/invoices/upload", async (req: Request, res: Response) => {
    try {
      const { invoices, supplierId } = req.body;
      
      if (!Array.isArray(invoices) || !supplierId) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      
      console.log("Received invoices data:", JSON.stringify(invoices, null, 2));
      
      const processedInvoices = [];
      
      for (const csvInvoice of invoices) {
        // Ensure the InvoiceAmount is a valid number
        let invoiceAmount: number;
        
        if (typeof csvInvoice.InvoiceAmount === 'number') {
          invoiceAmount = csvInvoice.InvoiceAmount;
        } else if (typeof csvInvoice.InvoiceAmount === 'string') {
          // Remove any non-numeric characters except decimal point
          const cleanedAmount = csvInvoice.InvoiceAmount.replace(/[^0-9.]/g, '');
          invoiceAmount = parseFloat(cleanedAmount);
        } else {
          throw new Error(`Invalid InvoiceAmount format for invoice ${csvInvoice.InvoiceID}`);
        }
        
        if (isNaN(invoiceAmount)) {
          throw new Error(`InvoiceAmount is not a valid number for invoice ${csvInvoice.InvoiceID}`);
        }
        
        const invoiceData = {
          invoiceId: csvInvoice.InvoiceID,
          invoiceAmount,
          invoiceDate: csvInvoice.InvoiceDate,
          dueDate: csvInvoice.DueDate,
          buyerName: csvInvoice.BuyerName,
          status: typeof csvInvoice.Status === 'string' ? csvInvoice.Status.toLowerCase() : 'pending',
          supplierId,
        };
        
        const validatedInvoice = validateRequest(insertInvoiceSchema, invoiceData);
        const createdInvoice = await storage.createInvoice(validatedInvoice);
        processedInvoices.push(createdInvoice);
      }
      
      res.status(201).json({ message: "Invoices uploaded successfully", count: processedInvoices.length });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Update invoice
  router.patch("/invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, updates);
      res.json(updatedInvoice);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Create discount offer
  router.post("/discount-offers", async (req: Request, res: Response) => {
    try {
      const offerData = validateRequest(insertDiscountOfferSchema, req.body);
      const createdOffer = await storage.createDiscountOffer(offerData);
      
      res.status(201).json(createdOffer);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Get pending discount offers
  router.get("/discount-offers/pending", async (_req: Request, res: Response) => {
    try {
      const offers = await storage.getPendingDiscountOffers();
      
      // For each offer, fetch the associated invoice
      const offersWithInvoices = await Promise.all(
        offers.map(async (offer) => {
          const invoice = await storage.getInvoice(offer.invoiceId);
          return { ...offer, invoice };
        })
      );
      
      res.json(offersWithInvoices);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Update discount offer status
  router.patch("/discount-offers/:id", async (req: Request, res: Response) => {
    try {
      const offerId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedOffer = await storage.updateDiscountOfferStatus(offerId, status);
      res.json(updatedOffer);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Get auto-approval settings for a user
  router.get("/auto-approval-settings", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string | undefined;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const settings = await storage.getAutoApprovalSettings(userId);
      res.json(settings || { enabled: false, maxDiscountRate: 2.5, maxAmount: 100000 });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Create or update auto-approval settings
  router.post("/auto-approval-settings", async (req: Request, res: Response) => {
    try {
      const settingsData = validateRequest(insertAutoApprovalSettingsSchema, req.body);
      const settings = await storage.upsertAutoApprovalSettings(settingsData);
      
      res.status(201).json(settings);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Get KPI summary for supplier or buyer
  router.get("/kpi/:role", async (req: Request, res: Response) => {
    try {
      const { role } = req.params;
      const userId = req.query.userId as string | undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      if (role === "supplier") {
        const invoices = await storage.getInvoicesBySupplier(userId);
        const offers = await storage.getDiscountOffersBySupplierId(userId);
        
        const acceptedOffers = offers.filter(offer => offer.status === "accepted");
        
        const kpiSummary = {
          invoiceCount: invoices.length,
          discountValue: acceptedOffers.reduce((sum, offer) => sum + offer.discountValue, 0),
          avgDiscountRate: acceptedOffers.length > 0 
            ? acceptedOffers.reduce((sum, offer) => sum + offer.discountRate, 0) / acceptedOffers.length 
            : 0
        };
        
        res.json(kpiSummary);
      } else if (role === "buyer") {
        const pendingOffers = await storage.getPendingDiscountOffers();
        const acceptedOffers = await storage.getAcceptedDiscountOffers();
        
        const kpiSummary = {
          invoiceCount: pendingOffers.length,
          discountValue: acceptedOffers.reduce((sum, offer) => sum + offer.discountValue, 0),
          avgDiscountRate: acceptedOffers.length > 0 
            ? acceptedOffers.reduce((sum, offer) => sum + offer.discountRate, 0) / acceptedOffers.length 
            : 0
        };
        
        res.json(kpiSummary);
      } else {
        res.status(400).json({ message: "Invalid role" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Get chart data
  router.get("/charts/:role", async (req: Request, res: Response) => {
    try {
      const { role } = req.params;
      
      if (role === "supplier") {
        res.json(supplierChartData);
      } else if (role === "buyer") {
        res.json(buyerChartData);
      } else {
        res.status(400).json({ message: "Invalid role" });
      }
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Get unique buyers
  router.get("/buyers", async (_req: Request, res: Response) => {
    try {
      const buyers = await storage.getUniqueBuyers();
      res.json(buyers);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Get unique suppliers
  router.get("/suppliers", async (_req: Request, res: Response) => {
    try {
      const suppliers = await storage.getUniqueSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
    }
  });

  // Register API routes
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
