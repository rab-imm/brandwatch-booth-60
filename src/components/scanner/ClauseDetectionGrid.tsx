import { Card, CardContent } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"

interface ClauseCard {
  type: string
  displayName: string
  icon: string
  color: string
  confidence?: number
  text?: string
}

interface ClauseDetectionGridProps {
  clauses: ClauseCard[]
  onClauseClick?: (clause: ClauseCard) => void
}

export const ClauseDetectionGrid = ({ clauses, onClauseClick }: ClauseDetectionGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {clauses.map((clause, idx) => (
        <Card 
          key={idx}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-t-4"
          style={{ borderTopColor: clause.color }}
          onClick={() => onClauseClick?.(clause)}
        >
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${clause.color}15` }}
            >
              <Icon 
                name={clause.icon as any} 
                className="h-6 w-6"
                style={{ color: clause.color }}
              />
            </div>
            
            <h4 className="font-semibold text-sm mb-1 line-clamp-2">{clause.displayName}</h4>
            
            {clause.confidence && (
              <Badge variant="secondary" className="text-xs mt-1">
                {Math.round(clause.confidence * 100)}% match
              </Badge>
            )}
            
            {clause.text && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {clause.text.substring(0, 60)}...
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
