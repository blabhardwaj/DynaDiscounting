import { useQuery } from '@tanstack/react-query';
import { File, PercentCircle, Wallet } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import ChartSection from '@/components/dashboard/ChartSection';
import InvoiceUpload from '@/components/supplier/InvoiceUpload';
import InvoiceTable from '@/components/supplier/InvoiceTable';
import { KPISummary } from '@/types';
import { formatIndianCurrency, formatPercentage } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';

const SupplierDashboard = () => {
  const { user } = useAuth();
  
  const { data: kpiSummary, isLoading: isLoadingKPI } = useQuery<KPISummary>({
    queryKey: ['/api/kpi/supplier', user?.id],
  });
  
  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<any[]>({
    queryKey: ['/api/charts/supplier', user?.id],
  });
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Supplier Dashboard</h1>
        <p className="text-gray-600">Manage your invoices and discount offers</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Total Invoices"
          value={isLoadingKPI ? '...' : kpiSummary?.invoiceCount.toString() || '0'}
          icon={<File className="h-6 w-6 text-primary" />}
          subtitle="+12% from last month"
        />
        
        <KPICard
          title="Discount Value"
          value={isLoadingKPI ? '...' : formatIndianCurrency(kpiSummary?.discountValue || 0)}
          icon={<Wallet className="h-6 w-6 text-green-600" />}
          subtitle="Total savings achieved"
          iconBgClass="bg-green-100"
        />
        
        <KPICard
          title="Avg. Discount Rate"
          value={isLoadingKPI ? '...' : formatPercentage(kpiSummary?.avgDiscountRate || 0)}
          icon={<PercentCircle className="h-6 w-6 text-amber-600" />}
          subtitle="Based on accepted offers"
          iconBgClass="bg-amber-100"
        />
      </div>
      
      {/* Chart Section */}
      <ChartSection 
        title="Discount Offers Trend" 
        data={chartData} 
        chartType="line"
        isSupplier={true}
      />
      
      {/* Upload Invoice Section */}
      <InvoiceUpload />
      
      {/* Invoice Table */}
      <InvoiceTable />
    </div>
  );
};

export default SupplierDashboard;
