import { useState, useMemo } from 'react';
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

const SUGGESTED_RATES = [1.5, 2.0, 2.5, 3.0, 3.5];
const ANNUAL_RATE = 0.10; // 10% annualized

const DiscountOfferModal = ({ invoice, isOpen, onClose }: DiscountOfferModalProps) => {
  const [discountRate, setDiscountRate] = useState(2.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const earlyPaymentDate = useMemo(() => addBusinessDays(new Date(), 1), []);
  const dueDate = useMemo(() => parseDate(invoice.dueDate), [invoice.dueDate]);
  const daysRemaining = useMemo(() => getDaysBetweenDates(earlyPaymentDate, dueDate), [earlyPaymentDate, dueDate]);

  const { originalAmount, discountValue, discountedAmount, dcfValue } = useMemo(() => {
    const originalAmount = invoice.invoiceAmount;
    const discountValue = originalAmount * (discountRate / 100);
    const discountedAmount = originalAmount - discountValue;
    const dcfValue = calculateDCF(discountedAmount, ANNUAL_RATE, daysRemaining);

    return { originalAmount, discountValue, discountedAmount, dcfValue };
  }, [invoice.invoiceAmount, discountRate, daysRemaining]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const supplierId = "supplier1"; // Demo supplier
      const supplierName = "Demo Supplier";

      const offerData = {
        invoiceId: invoice.id,
        originalAmount,
        discountRate,
        discountedAmount,
        discountValue,
        earlyPaymentDate: formatDate(earlyPaymentDate.toISOString()),
        dcfValue,
        supplierId,
        supplierName,
      };

      await apiRequest('POST', '/api/discount-offers', offerData);

      await apiRequest('PATCH', `/api/invoices/${invoice.id}`, {
        status: 'pending_approval',
      });

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
          <InvoiceDetails invoice={invoice} />

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

            <div className="flex flex-wrap gap-2 mt-2">
              <p className="text-sm text-gray-500 w-full">Suggested rates:</p>
              {SUGGESTED_RATES.map((rate) => (
                <Button
                  key={rate}
                  variant={discountRate === rate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiscountRate(rate)}
                  className="px-3 py-1 h-8"
                >
                  {formatPercentage(rate)}
                </Button>
              ))}
            </div>
          </div>

          <DiscountSummary
            originalAmount={originalAmount}
            discountValue={discountValue}
            discountedAmount={discountedAmount}
            earlyPaymentDate={earlyPaymentDate}
            dcfValue={dcfValue}
            daysRemaining={daysRemaining}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Discount Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InvoiceDetails = ({ invoice }: { invoice: Invoice }) => (
  <div className="bg-gray-50 p-4 rounded-md">
    <div className="grid grid-cols-2 gap-3">
      <DetailItem label="Invoice ID" value={invoice.invoiceId} />
      <DetailItem label="Buyer" value={invoice.buyerName} />
      <DetailItem label="Invoice Amount" value={formatIndianCurrency(invoice.invoiceAmount)} />
      <DetailItem label="Due Date" value={formatDate(invoice.dueDate)} />
    </div>
  </div>
);

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

const DiscountSummary = ({
  originalAmount,
  discountValue,
  discountedAmount,
  earlyPaymentDate,
  dcfValue,
  daysRemaining,
}: {
  originalAmount: number;
  discountValue: number;
  discountedAmount: number;
  earlyPaymentDate: Date;
  dcfValue: number;
  daysRemaining: number;
}) => (
  <div className="bg-gray-50 p-4 rounded-md space-y-2">
    <SummaryItem label="Original Amount" value={formatIndianCurrency(originalAmount)} />
    <SummaryItem label="Discount Value" value={formatIndianCurrency(discountValue)} />
    <SummaryItem label="Discounted Amount" value={formatIndianCurrency(discountedAmount)} />
    <SummaryItem label="Early Payment Date" value={formatDate(earlyPaymentDate.toISOString())} />
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
);

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-sm text-gray-600">{label}:</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

export default DiscountOfferModal;
