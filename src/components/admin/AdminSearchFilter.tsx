import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface FilterConfig {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange'
  options?: { value: string; label: string }[]
}

interface AdminSearchFilterProps {
  onFilterChange: (filters: Record<string, any>) => void
  filterConfigs: FilterConfig[]
  className?: string
}

export const AdminSearchFilter = ({ 
  onFilterChange, 
  filterConfigs, 
  className 
}: AdminSearchFilterProps) => {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onFilterChange({ ...filters, search: searchTerm })
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [filters, searchTerm, onFilterChange])

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm("")
  }

  const activeFilterCount = Object.keys(filters).filter(key => 
    filters[key] !== undefined && filters[key] !== null && filters[key] !== ""
  ).length + (searchTerm ? 1 : 0)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {filterConfigs.map(config => (
          <div key={config.key} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              {config.label}
            </label>
            
            {config.type === 'select' && (
              <Select
                value={filters[config.key] || "all"}
                onValueChange={(value) => handleFilterChange(config.key, value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {config.options?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {config.type === 'text' && (
              <Input
                placeholder={config.label}
                value={filters[config.key] || ""}
                onChange={(e) => handleFilterChange(config.key, e.target.value)}
                className="w-40"
              />
            )}
            
            {config.type === 'date' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-40 justify-start text-left font-normal",
                      !filters[config.key] && "text-muted-foreground"
                    )}
                  >
                    <Icon name="calendar" className="mr-2 h-4 w-4" />
                    {filters[config.key] ? (
                      format(filters[config.key], "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters[config.key]}
                    onSelect={(date) => handleFilterChange(config.key, date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}
        
        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-2 py-1">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2"
            >
              <Icon name="x" className="h-4 w-4" />
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}