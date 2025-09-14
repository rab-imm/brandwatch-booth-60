import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, item: any) => React.ReactNode
  className?: string
}

interface EnhancedDataTableProps {
  data: any[]
  columns: Column[]
  onSelectionChange: (selectedIds: string[]) => void
  selectedItems: string[]
  loading?: boolean
  emptyMessage?: string
  itemIdKey?: string
  className?: string
}

export const EnhancedDataTable = ({
  data,
  columns,
  onSelectionChange,
  selectedItems,
  loading = false,
  emptyMessage = "No data available",
  itemIdKey = "id",
  className
}: EnhancedDataTableProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
  }

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    : data

  const isAllSelected = data.length > 0 && selectedItems.length === data.length
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < data.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(item => item[itemIdKey]))
    }
  }

  const handleSelectItem = (itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId]
    
    onSelectionChange(newSelection)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Icon name="loader" className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-12">
        <Icon name="inbox" className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                {...(isIndeterminate && { 
                  ref: (el: any) => {
                    if (el) (el as any).indeterminate = isIndeterminate
                  }
                })}
              />
            </TableHead>
            
            {columns.map(column => (
              <TableHead
                key={column.key}
                className={cn(
                  column.className,
                  column.sortable && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <div className="flex flex-col">
                      <Icon
                        name="chevron-up"
                        className={cn(
                          "h-3 w-3",
                          sortConfig?.key === column.key && sortConfig.direction === 'asc'
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      />
                      <Icon
                        name="chevron-down"
                        className={cn(
                          "h-3 w-3 -mt-1",
                          sortConfig?.key === column.key && sortConfig.direction === 'desc'
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {sortedData.map((item) => (
            <TableRow
              key={item[itemIdKey]}
              className={cn(
                selectedItems.includes(item[itemIdKey]) && "bg-muted/50"
              )}
            >
              <TableCell>
                <Checkbox
                  checked={selectedItems.includes(item[itemIdKey])}
                  onCheckedChange={() => handleSelectItem(item[itemIdKey])}
                  aria-label={`Select item ${item[itemIdKey]}`}
                />
              </TableCell>
              
              {columns.map(column => (
                <TableCell key={column.key} className={column.className}>
                  {column.render
                    ? column.render(item[column.key], item)
                    : item[column.key]
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}