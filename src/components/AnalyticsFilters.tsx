import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDays, format, subDays, subMonths, subWeeks } from "date-fns"

interface DateRange {
  from: Date
  to: Date
}

interface AnalyticsFiltersProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  selectedMetrics: string[]
  onMetricsChange: (metrics: string[]) => void
  availableMetrics: { id: string; label: string }[]
  onRefresh: () => void
  isLoading?: boolean
}

const presetRanges = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
  { label: "This week", value: "week", weeks: 0 },
  { label: "Last week", value: "lastWeek", weeks: 1 },
  { label: "This month", value: "month", months: 0 },
  { label: "Last month", value: "lastMonth", months: 1 },
]

export const AnalyticsFilters = ({
  dateRange,
  onDateRangeChange,
  selectedMetrics,
  onMetricsChange,
  availableMetrics,
  onRefresh,
  isLoading = false
}: AnalyticsFiltersProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handlePresetRange = (preset: typeof presetRanges[0]) => {
    const now = new Date()
    let from: Date
    let to: Date = now

    if (preset.days) {
      from = subDays(now, preset.days)
    } else if (preset.weeks !== undefined) {
      if (preset.weeks === 0) {
        // This week
        from = subDays(now, now.getDay())
      } else {
        // Last week
        from = subDays(now, now.getDay() + 7)
        to = subDays(now, now.getDay() + 1)
      }
    } else if (preset.months !== undefined) {
      if (preset.months === 0) {
        // This month
        from = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        // Last month
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        to = new Date(now.getFullYear(), now.getMonth(), 0)
      }
    } else {
      from = subDays(now, 7) // Default fallback
    }

    onDateRangeChange({ from, to })
  }

  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onMetricsChange(selectedMetrics.filter(id => id !== metricId))
    } else {
      onMetricsChange([...selectedMetrics, metricId])
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Analytics Filters</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <Icon name={isLoading ? "loader" : "refresh-cw"} className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Date Range</label>
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {presetRanges.map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                onClick={() => handlePresetRange(preset)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Date Picker */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <Icon name="calendar" className="h-4 w-4 mr-2" />
                {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      onDateRangeChange({ from: range.from, to: range.to })
                      setIsCalendarOpen(false)
                    }
                  }}
                  disabled={(date) => date > new Date() || date < subMonths(new Date(), 12)}
                  initialFocus
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Metrics Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Metrics to Display</label>
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map((metric) => (
              <Badge
                key={metric.id}
                variant={selectedMetrics.includes(metric.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleMetric(metric.id)}
              >
                {metric.label}
                {selectedMetrics.includes(metric.id) && (
                  <Icon name="x" className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Click to toggle metrics on/off
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMetricsChange(availableMetrics.map(m => m.id))}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMetricsChange([])}
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}