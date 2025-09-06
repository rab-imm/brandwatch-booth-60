import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { chartConfig, chartStyles, chartAnimations, mapSeriesLabelsToColors, createGradient } from '@/components/ui/chartTheme';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ChartAreaProps {
  data: any[];
  dataKeys: string[];
  xAxisKey: string;
  className?: string;
  showGrid?: boolean;
  stacked?: boolean;
  curved?: boolean;
  useGradient?: boolean;
}

export function ChartArea({ 
  data, 
  dataKeys, 
  xAxisKey, 
  className = "",
  showGrid = true,
  stacked = false,
  curved = true,
  useGradient = true
}: ChartAreaProps) {
  const colors = mapSeriesLabelsToColors(dataKeys);
  
  const config = dataKeys.reduce((acc, key, index) => {
    acc[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color: colors[index],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          {useGradient && (
            <defs>
              {dataKeys.map((key, index) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[index]} stopOpacity={0.9} />
                  <stop offset="50%" stopColor={colors[index]} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={colors[index]} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
          )}
          {showGrid && (
            <CartesianGrid 
              strokeDasharray={chartStyles.grid.strokeDasharray}
              stroke={chartStyles.grid.stroke}
              strokeWidth={chartStyles.grid.strokeWidth}
            />
          )}
          <XAxis 
            dataKey={xAxisKey}
            stroke={chartStyles.axis.stroke}
            fontSize={chartStyles.axis.fontSize}
            fontWeight={chartStyles.axis.fontWeight}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={chartStyles.axis.stroke}
            fontSize={chartStyles.axis.fontSize}
            fontWeight={chartStyles.axis.fontWeight}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type={curved ? "monotone" : "linear"}
              dataKey={key}
              stackId={stacked ? "1" : undefined}
              stroke={colors[index]}
              strokeWidth={chartStyles.area.strokeWidth}
              fill={useGradient ? `url(#gradient-${key})` : colors[index]}
              fillOpacity={useGradient ? 1 : chartStyles.area.fillOpacity}
              animationDuration={chartAnimations.area.duration}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}