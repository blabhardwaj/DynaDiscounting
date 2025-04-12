import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowRightCircle, Wallet } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import ChartSection from '@/components/dashboard/ChartSection';
import OfferTable from '@/components/buyer/OfferTable';
import AutoApprovalSettings from '@/components/buyer/AutoApprovalSettings';
import { KPISummary } from '@/types';
import { formatIndianCurrency, formatPercentage } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';

const BuyerDashboard = () => {
  const { user } = useAuth();
  
  const { data: kpiSummary, isLoading: isLoadingKPI } = useQuery<KPISummary>({
    queryKey: ['/api/kpi/buyer', user?.id],
  });
  
  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<any[]>({
    queryKey: ['/api/charts/buyer', user?.id],
  });
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Buyer Dashboard</h1>
        <p className="text-gray-600">Manage discount offers from your suppliers</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Pending Offers"
          value={isLoadingKPI ? '...' : kpiSummary?.invoiceCount.toString() || '0'}
          icon={<Clock className="h-6 w-6 text-primary" />}
          subtitle="Awaiting your response"
        />
        
        <KPICard
          title="Cash Outflow"
          value={isLoadingKPI ? '...' : formatIndianCurrency(kpiSummary?.discountValue || 0)}
          icon={<ArrowRightCircle className="h-6 w-6 text-red-600" />}
          subtitle="Next 30 days estimated"
          iconBgClass="bg-red-100"
        />
        
        <KPICard
          title="Saved Amount"
          value={isLoadingKPI ? '...' : formatIndianCurrency(kpiSummary?.discountValue || 0)}
          icon={<Wallet className="h-6 w-6 text-green-600" />}
          subtitle="+15% from last quarter"
          iconBgClass="bg-green-100"
        />
      </div>
      
      {/* Chart Section */}
      <ChartSection 
        title="Discount Overview" 
        data={chartData} 
        chartType="bar"
        isSupplier={false}
      />
      
      {/* Discount Offers Table */}
      <OfferTable />
      
      {/* Auto-Approval Settings */}
      <AutoApprovalSettings />
    </div>
  );
};

export default BuyerDashboard;
