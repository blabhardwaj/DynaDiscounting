import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import OfferTable from '@/components/buyer/OfferTable';
import { DiscountOffer } from '@/types';

const BuyerOffersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: offers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/discount-offers/pending'],
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Discount Offers</h2>
        <p className="text-gray-500">
          Review and manage discount offers from suppliers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferTable
            offers={offers}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerOffersPage;