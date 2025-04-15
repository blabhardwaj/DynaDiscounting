import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import CountUp from 'react-countup';

interface KPICardProps {
  title: string;
  value: string;
  icon: ReactNode;
  subtitle?: string;
  iconBgClass?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  subtitle,
  iconBgClass = 'bg-primary-light bg-opacity-10',
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <div className={`p-2 ${iconBgClass} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-800 indian-currency">
  <CountUp end={parseFloat(value.replace(/[^\d.-]/g, ''))} duration={1.5} separator="," prefix="₹" />
</p>
        {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export default KPICard;
