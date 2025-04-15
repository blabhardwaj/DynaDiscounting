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
  Legend,
} from "recharts";
import { formatIndianCurrency } from "@/lib/format";

interface ChartSectionProps {
  title: string;
  data: { name: string; value: number; accepted?: number; savings?: number }[];
  chartType?: "line" | "bar";
  isSupplier?: boolean;
}

const ChartSection: React.FC<ChartSectionProps> = ({
  title,
  data,
  chartType = "line",
  isSupplier = true,
}) => {
  const formatYAxis = (value: number): string => {
    return value >= 1000 ? `${Math.round(value / 1000)}K` : value.toString();
  };

  const renderLineChart = () => (
    <LineChart
      data={data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis tickFormatter={formatYAxis} />
      <Tooltip
        formatter={(value) => [formatIndianCurrency(Number(value)), "Amount"]}
      />
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
  );

  const renderBarChart = () => (
    <BarChart
      data={data}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis tickFormatter={formatYAxis} />
      <Tooltip
        formatter={(value) => [formatIndianCurrency(Number(value)), "Amount"]}
      />
      <Legend />
      <Bar
        dataKey="value"
        fill="hsl(var(--primary))"
        name={isSupplier ? "Total Value" : "Discount Value"}
      />
      <Bar dataKey="savings" fill="hsl(var(--success))" name="Savings" />
    </BarChart>
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? renderLineChart() : renderBarChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartSection;
