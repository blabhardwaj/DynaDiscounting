import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ChartSection from '@/components/dashboard/ChartSection';
import KPICard from '@/components/dashboard/KPICard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarRange, CreditCard, DollarSign, PercentIcon, TrendingUp } from 'lucide-react';
import { formatIndianCurrency, formatPercentage } from '@/lib/format';

const ReportsPage = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState('monthly');

  const {
    data: kpiData,
    isLoading: isLoadingKPI,
  } = useQuery({
    queryKey: ['/api/kpi', userRole, { userId: user?.id }],
    enabled: !!user?.id,
  });

  const {
    data: chartData = [],
    isLoading: isLoadingCharts,
  } = useQuery({
    queryKey: ['/api/charts', userRole, { period }],
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Reports & Analytics</h2>
        <p className="text-gray-500">
          Review performance metrics and transaction analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Transactions"
          value={kpiData?.invoiceCount?.toString() || "0"}
          icon={<CreditCard className="h-4 w-4" />}
          subtitle="All time"
        />
        <KPICard
          title="Total Discount Value"
          value={kpiData?.discountValue ? formatIndianCurrency(kpiData.discountValue) : "₹0"}
          icon={<DollarSign className="h-4 w-4" />}
          subtitle="All time"
          iconBgClass="bg-green-100"
        />
        <KPICard
          title="Avg. Discount Rate"
          value={kpiData?.avgDiscountRate ? formatPercentage(kpiData.avgDiscountRate) : "0%"}
          icon={<PercentIcon className="h-4 w-4" />}
          subtitle="All time"
          iconBgClass="bg-blue-100"
        />
        <KPICard
          title="Cash Flow Impact"
          value={kpiData?.cashFlowImpact ? formatIndianCurrency(kpiData.cashFlowImpact) : "₹0"}
          icon={<TrendingUp className="h-4 w-4" />}
          subtitle="Last 30 days"
          iconBgClass="bg-purple-100"
        />
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex h-auto">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartSection
                title="Monthly Transaction Volume"
                data={chartData}
                chartType="bar"
                isSupplier={userRole === 'supplier'}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="discounts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Discount Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartSection
                title="Discount Trends Over Time"
                data={chartData}
                isSupplier={userRole === 'supplier'}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;