import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { chartConfig, chartStyles, chartAnimations, mapSeriesLabelsToColors } from '@/components/ui/chartTheme';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface ChartLineProps {
  data: any[];
  dataKeys: string[];
  xAxisKey: string;
  className?: string;
  showGrid?: boolean;
  curved?: boolean;
}

export function ChartLine({ 
  data, 
  dataKeys, 
  xAxisKey, 
  className = "",
  showGrid = true,
  curved = true 
}: ChartLineProps) {
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
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
            <Line
              key={key}
              type={curved ? "monotone" : "linear"}
              dataKey={key}
              stroke={colors[index]}
              strokeWidth={chartStyles.line.strokeWidth}
              strokeLinecap={chartStyles.line.strokeLinecap}
              strokeLinejoin={chartStyles.line.strokeLinejoin}
              dot={{ 
                fill: colors[index], 
                strokeWidth: 0, 
                r: 4,
                className: "hover:r-6 transition-all duration-200"
              }}
              activeDot={{ 
                r: 6, 
                stroke: colors[index],
                strokeWidth: 2,
                fill: chartConfig.background.card
              }}
              animationDuration={chartAnimations.line.duration}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}