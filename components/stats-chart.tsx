'use client';

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ChartDataPoint } from '@/lib/types';
import { format } from 'date-fns';

interface StatsChartProps {
  data: ChartDataPoint[];
  className?: string;
}

export function StatsChart({ data, className }: StatsChartProps) {
  const chartConfig = {
    installs: {
      label: 'Installs',
      color: 'hsl(var(--chart-1))',
    },
  };

  const formattedData = data.map((point) => ({
    ...point,
    date: format(new Date(point.date), 'MMM dd'),
  }));

  return (
    <ChartContainer config={chartConfig} className={className}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          className="text-xs"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="installs"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}