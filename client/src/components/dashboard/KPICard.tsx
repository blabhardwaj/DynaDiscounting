import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: string;
  icon: ReactNode;
  subtitle?: string;
  iconBgClass?: string;
}

const KPICard = ({ title, value, icon, subtitle, iconBgClass = 'bg-primary-light bg-opacity-10' }: KPICardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <div className={`p-2 ${iconBgClass} rounded-full`}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-800 indian-currency">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export default KPICard;
