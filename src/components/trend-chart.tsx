'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useTheme } from '@/components/theme-provider';

interface TrendChartProps {
  data: Array<{
    date: string;
    [key: string]: string | number | null | undefined;
  }>;
  dataKey: string;
  chartType?: 'line' | 'area' | 'bar';
  color?: string;
  formatValue?: (value: number) => string;
}

export function TrendChart({
  data,
  dataKey,
  chartType = 'line',
  color = '#8884d8',
  formatValue = (value) => value.toLocaleString(),
}: TrendChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#374151' : '#f0f0f0';
  const axisColor = isDark ? '#6b7280' : '#9ca3af';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-semibold" style={{ color }}>
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const chartData = [...data].reverse(); // Oldest to newest

    const axisProps = {
      tick: { fontSize: 11, fill: axisColor },
      stroke: axisColor,
    };

    const yAxisProps = {
      ...axisProps,
      tickFormatter: formatValue,
      width: 55,
    };

    if (chartType === 'bar') {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="date" tickFormatter={formatDate} {...axisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }

    if (chartType === 'area') {
      return (
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="date" tickFormatter={formatDate} {...axisProps} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.3}
          />
        </AreaChart>
      );
    }

    // Default: Line chart
    return (
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="date" tickFormatter={formatDate} {...axisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={chartData.length <= 14}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    );
  };

  return (
    <div className="h-[200px] w-full sm:h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
