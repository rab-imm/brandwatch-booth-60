import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { chartConfig, chartStyles, donutStyles, mapSeriesLabelsToColors } from '@/components/ui/chartTheme';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface DonutDataPoint {
  name: string;
  value: number;
  percentage?: number;
}

interface ChartDonutProps {
  data: DonutDataPoint[];
  className?: string;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export function ChartDonut({ 
  data, 
  className = "", 
  showLegend = true,
  centerLabel,
  centerValue 
}: ChartDonutProps) {
  const labels = data.map(item => item.name);
  const colors = mapSeriesLabelsToColors(labels);

  const config = labels.reduce((acc, label, index) => {
    acc[label] = {
      label,
      color: colors[index],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={donutStyles.innerRadius}
            outerRadius={donutStyles.outerRadius}
            paddingAngle={donutStyles.paddingAngle}
            cornerRadius={donutStyles.cornerRadius}
            stroke="none"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index]}
                className="hover:opacity-80 transition-opacity duration-200"
              />
            ))}
          </Pie>
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ fill: 'transparent' }}
          />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
                color: chartConfig.text.muted
              }}
            />
          )}
          {(centerLabel || centerValue) && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-sm font-medium"
            >
              {centerValue && (
                <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
                  {centerValue}
                </tspan>
              )}
              {centerLabel && (
                <tspan x="50%" dy="1.2em" className="text-xs text-muted-foreground">
                  {centerLabel}
                </tspan>
              )}
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}