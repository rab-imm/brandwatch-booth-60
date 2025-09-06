// Comprehensive chart design framework for consistent, beautiful visualizations
export const chartConfig = {
  colors: {
    chart1: 'hsl(var(--chart-1))',
    chart2: 'hsl(var(--chart-2))',  
    chart3: 'hsl(var(--chart-3))',
    chart4: 'hsl(var(--chart-4))',
    chart5: 'hsl(var(--chart-5))',
    chart6: 'hsl(var(--chart-6))',
    chart7: 'hsl(var(--chart-7))',
    chart8: 'hsl(var(--chart-8))',
    chart9: 'hsl(var(--chart-9))',
    chart10: 'hsl(var(--chart-10))',
    chart11: 'hsl(var(--chart-11))',
    chart12: 'hsl(var(--chart-12))',
  },
  text: {
    primary: 'hsl(var(--foreground))',
    muted: 'hsl(var(--muted-foreground))',
  },
  background: {
    card: 'hsl(var(--card))',
    border: 'hsl(var(--border))',
  }
}

// Deterministic color mapping - same label always gets same color
export const hashLabelToColor = (label: string): string => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    const char = label.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const colors = Object.values(chartConfig.colors);
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Map series labels to consistent colors
export const mapSeriesLabelsToColors = (labels: string[]): string[] => {
  return labels.map(label => hashLabelToColor(label));
};

// Smart color mapping for different chart types (legacy support)
export const getChartColors = (count: number) => {
  const colors = Object.values(chartConfig.colors);
  return colors.slice(0, Math.min(count, colors.length));
}

// Predefined color schemes for common use cases
export const chartSchemes = {
  sentiment: [chartConfig.colors.chart4, chartConfig.colors.chart2, chartConfig.colors.chart5], // Green, Pink, Yellow
  engagement: [chartConfig.colors.chart1, chartConfig.colors.chart3], // Blue, Purple
  marketShare: [chartConfig.colors.chart1, chartConfig.colors.chart2, chartConfig.colors.chart3, chartConfig.colors.chart4, chartConfig.colors.chart5],
  performance: [chartConfig.colors.chart6, chartConfig.colors.chart7, chartConfig.colors.chart8],
  growth: [chartConfig.colors.chart9, chartConfig.colors.chart10, chartConfig.colors.chart11, chartConfig.colors.chart12]
}

// Enhanced gradient system for all chart types
export const createGradient = (colorKey: keyof typeof chartConfig.colors, id: string) => ({
  id,
  color: chartConfig.colors[colorKey],
  stops: [
    { offset: '0%', opacity: 0.9 },
    { offset: '50%', opacity: 0.6 },
    { offset: '100%', opacity: 0.1 }
  ]
});

// Pre-built gradients for common patterns
export const chartGradients = {
  sentiment: createGradient('chart1', 'sentimentGradient'),
  engagement: createGradient('chart3', 'engagementGradient'),
  performance: createGradient('chart6', 'performanceGradient'),
  growth: createGradient('chart9', 'growthGradient')
}

// Donut chart specific styling
export const donutStyles = {
  innerRadius: '60%',
  outerRadius: '85%',
  paddingAngle: 2,
  cornerRadius: 6,
  strokeWidth: 0
}

// Universal chart styling system - pastel-optimized
export const chartStyles = {
  grid: {
    strokeDasharray: "2 4",
    stroke: 'hsl(var(--muted-foreground) / 0.12)',
    strokeWidth: 0.5
  },
  axis: {
    stroke: 'hsl(var(--muted-foreground) / 0.35)',
    fontSize: 11,
    fontWeight: 400
  },
  tooltip: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
    boxShadow: '0 4px 20px -2px hsl(var(--foreground) / 0.08)',
    padding: '12px'
  },
  line: {
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  },
  area: {
    fillOpacity: 0.6,
    strokeWidth: 2
  }
}

// Animation presets for different chart types
export const chartAnimations = {
  line: { duration: 800, ease: 'easeInOut' },
  area: { duration: 1000, ease: 'easeInOut' },
  pie: { duration: 600, ease: 'easeOut' },
  bar: { duration: 400, ease: 'easeOut' }
}