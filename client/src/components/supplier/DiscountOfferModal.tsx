import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Invoice } from "@/types";
import { formatIndianCurrency, formatDate, formatPercentage } from "@/lib/format";
import { addBusinessDays, calculateDCF, getDaysBetweenDates, parseDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface DiscountOfferModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

const DiscountOfferModal = ({ invoice, isOpen, onClose }: DiscountOfferModalProps) => {
  const [discountRate, setDiscountRate] = useState(2.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Calculate discount values
  const originalAmount = invoice.invoiceAmount;
  const discountValue = originalAmount * (discountRate / 100);
  const discountedAmount = originalAmount - discountValue;
  
  // Early payment date (1 business day from today)
  const earlyPaymentDate = addBusinessDays(new Date(), 1);
  
  // Calculate DCF
  const dueDate = parseDate(invoice.dueDate);
  const daysRemaining = getDaysBetweenDates(earlyPaymentDate, dueDate);
  const annualRate = 0.10; // 10% annualized
  const dcfValue = calculateDCF(discountedAmount, annualRate, daysRemaining);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const offerData = {
        invoiceId: invoice.id,
        originalAmount,
        discountRate,
        discountedAmount,
        discountValue,
        earlyPaymentDate: formatDate(earlyPaymentDate.toISOString()),
        dcfValue,
        supplierId: user?.id,
        supplierName: user?.email?.split('@')[0] || 'Unknown Supplier', // Simple name from email
      };
      
      await apiRequest('POST', '/api/discount-offers', offerData);
      
      // Update invoice status
      await apiRequest('PATCH', `/api/invoices/${invoice.id}`, {
        status: 'pending_approval'
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      toast({
        title: 'Success',
        description: 'Discount offer submitted successfully.',
      });
      
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit discount offer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make Discount Offer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">Invoice ID</p>
                <p className="font-medium">{invoice.invoiceId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Buyer</p>
                <p className="font-medium">{invoice.buyerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Amount</p>
                <p className="font-medium indian-currency">{formatIndianCurrency(invoice.invoiceAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="discount-rate" className="block text-sm font-medium text-gray-700 mb-1">
              Discount Rate (%)
            </label>
            <div className="flex items-center space-x-3">
              <Slider
                id="discount-rate"
                min={0}
                max={5}
                step={0.1}
                defaultValue={[discountRate]}
                onValueChange={(values) => setDiscountRate(values[0])}
                className="flex-grow"
              />
              <span className="text-lg font-medium w-16 text-center">
                {formatPercentage(discountRate)}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Original Amount:</span>
              <span className="text-sm font-medium indian-currency">{formatIndianCurrency(originalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Discount Value:</span>
              <span className="text-sm font-medium indian-currency">{formatIndianCurrency(discountValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Discounted Amount:</span>
              <span className="text-sm font-medium indian-currency">{formatIndianCurrency(discountedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Early Payment Date:</span>
              <span className="text-sm font-medium">{formatDate(earlyPaymentDate.toISOString())}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">DCF Value:</span>
                <span className="text-sm font-medium indian-currency">{formatIndianCurrency(dcfValue)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Based on 10% annualized discount rate for {daysRemaining} days
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Discount Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountOfferModal;
