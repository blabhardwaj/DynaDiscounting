import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import InvoiceUpload from '@/components/supplier/InvoiceUpload';
import InvoiceTable from '@/components/supplier/InvoiceTable';
import { Invoice } from '@/types';

const SupplierInvoicesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const {
    data: invoices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/invoices', { supplierId: user?.id }],
    enabled: !!user?.id,
  });

  const handleMakeOffer = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDiscountModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Invoices</h2>
        <p className="text-gray-500">
          Manage your invoices and create discount offers for early payment
        </p>
      </div>

      <InvoiceUpload />

      <Card>
        <CardHeader>
          <CardTitle>Your Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceTable
            invoices={invoices}
            isLoading={isLoading}
            onMakeOffer={handleMakeOffer}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierInvoicesPage;