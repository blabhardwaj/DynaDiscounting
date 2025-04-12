import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search } from 'lucide-react';
import { DiscountOffer } from '@/types';
import { formatIndianCurrency, formatDate, formatPercentage } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

const OfferTable = () => {
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<DiscountOffer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [acceptAction, setAcceptAction] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: offers = [], isLoading } = useQuery<DiscountOffer[]>({
    queryKey: ['/api/discount-offers/pending'],
  });
  
  const { data: suppliers = [] } = useQuery<string[]>({
    queryKey: ['/api/suppliers'],
  });
  
  // Filter offers based on selected filters
  const filteredOffers = offers.filter(offer => {
    // Supplier filter
    if (supplierFilter !== 'all' && offer.supplierName !== supplierFilter) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        offer.invoice.invoiceId.toLowerCase().includes(query) ||
        offer.supplierName.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  const handleAction = (offer: DiscountOffer, accept: boolean) => {
    setSelectedOffer(offer);
    setAcceptAction(accept);
    setIsDialogOpen(true);
  };
  
  const processOffer = async () => {
    if (!selectedOffer) return;
    
    setIsProcessing(true);
    
    try {
      const status = acceptAction ? 'accepted' : 'rejected';
      
      // Update offer status
      await apiRequest('PATCH', `/api/discount-offers/${selectedOffer.id}`, {
        status
      });
      
      // If accepted, update invoice status as well
      if (acceptAction) {
        await apiRequest('PATCH', `/api/invoices/${selectedOffer.invoiceId}`, {
          status: 'completed'
        });
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/discount-offers/pending'] });
      
      toast({
        title: 'Success',
        description: `Offer ${acceptAction ? 'accepted' : 'rejected'} successfully.`,
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${acceptAction ? 'accept' : 'reject'} offer.`,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <>
      <Card className="overflow-hidden mb-8">
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <CardTitle>Incoming Discount Offers</CardTitle>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
              <Select 
                value={supplierFilter} 
                onValueChange={setSupplierFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search offers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Original Amount</TableHead>
                <TableHead>Discount Rate</TableHead>
                <TableHead>Discounted Amount</TableHead>
                <TableHead>Early Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No pending discount offers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">{offer.invoice.invoiceId}</TableCell>
                    <TableCell>{offer.supplierName}</TableCell>
                    <TableCell className="indian-currency">{formatIndianCurrency(offer.originalAmount)}</TableCell>
                    <TableCell>{formatPercentage(offer.discountRate)}</TableCell>
                    <TableCell className="indian-currency">{formatIndianCurrency(offer.discountedAmount)}</TableCell>
                    <TableCell>{formatDate(offer.earlyPaymentDate)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAction(offer, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAction(offer, false)}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredOffers.length}</span> of <span className="font-medium">{offers.length}</span> offers
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </div>
      </Card>
      
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {acceptAction ? 'Accept Discount Offer' : 'Reject Discount Offer'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {acceptAction ? (
                <>
                  Are you sure you want to accept this discount offer? 
                  You will be committing to pay <strong>{selectedOffer && formatIndianCurrency(selectedOffer.discountedAmount)}</strong> by <strong>{selectedOffer && formatDate(selectedOffer.earlyPaymentDate)}</strong>.
                </>
              ) : (
                'Are you sure you want to reject this discount offer? This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={processOffer}
              disabled={isProcessing}
              className={acceptAction ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isProcessing ? 'Processing...' : acceptAction ? 'Accept' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OfferTable;
