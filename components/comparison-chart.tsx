'use client';

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format } from 'date-fns';

interface ComparisonChartProps {
  data: any[];
  extensions: { id: string; name: string; color: string }[];
  className?: string;
}

export function ComparisonChart({ data, extensions, className }: ComparisonChartProps) {
  const chartConfig = extensions.reduce((acc, ext, index) => {
    acc[ext.id] = {
      label: ext.name,
      color: ext.color,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const formattedData = data.map((point) => ({
    ...point,
    date: format(new Date(point.date), 'MMM dd'),
  }));

  return (
    <ChartContainer config={chartConfig} className={className}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
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
        <Legend />
        {extensions.map((ext) => (
          <Line
            key={ext.id}
            type="monotone"
            dataKey={ext.id}
            stroke={ext.color}
            strokeWidth={2}
            dot={false}
            name={ext.name}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}