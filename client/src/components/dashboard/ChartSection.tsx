import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { formatIndianCurrency } from "@/lib/format";

interface ChartSectionProps {
  title: string;
  data: any[];
  chartType?: 'line' | 'bar';
  isSupplier?: boolean;
}

const ChartSection = ({ title, data, chartType = 'line', isSupplier = true }: ChartSectionProps) => {
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }
    return value;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatYAxis} />
                <Tooltip formatter={(value) => [formatIndianCurrency(Number(value)), 'Amount']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  activeDot={{ r: 8 }}
                  name={isSupplier ? "Discount Offers" : "Offers Value"}
                />
                {isSupplier && (
                  <Line
                    type="monotone"
                    dataKey="accepted"
                    stroke="hsl(var(--success))"
                    name="Accepted"
                  />
                )}
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatYAxis} />
                <Tooltip formatter={(value) => [formatIndianCurrency(Number(value)), 'Amount']} />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" name={isSupplier ? "Total Value" : "Discount Value"} />
                <Bar dataKey="savings" fill="hsl(var(--success))" name="Savings" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartSection;
