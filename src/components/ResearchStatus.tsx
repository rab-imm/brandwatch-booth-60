import { Icon } from "@/components/ui/Icon"
import { Badge } from "@/components/ui/badge"

interface ResearchStatusProps {
  status: 'researching' | 'analyzing' | 'complete' | 'error'
  hasResearch?: boolean
  hasDocuments?: boolean
  sourcesCount?: number
}

export const ResearchStatus = ({ 
  status, 
  hasResearch, 
  hasDocuments, 
  sourcesCount 
}: ResearchStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'researching':
        return {
          icon: 'search',
          text: 'Searching UAE legal sources...',
          color: 'bg-blue-500'
        }
      case 'analyzing':
        return {
          icon: 'brain',
          text: 'Analyzing legal information...',
          color: 'bg-amber-500'
        }
      case 'complete':
        return {
          icon: 'check',
          text: 'Research complete',
          color: 'bg-green-500'
        }
      case 'error':
        return {
          icon: 'alert-triangle',
          text: 'Research failed',
          color: 'bg-red-500'
        }
      default:
        return {
          icon: 'loader',
          text: 'Processing...',
          color: 'bg-gray-500'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
      <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
      <Icon name={config.icon} className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{config.text}</span>
      
      {status === 'complete' && (
        <div className="flex items-center space-x-1 ml-auto">
          {hasResearch && (
            <Badge variant="secondary" className="text-xs">
              Real-time
            </Badge>
          )}
          {hasDocuments && (
            <Badge variant="outline" className="text-xs">
              Documents
            </Badge>
          )}
          {sourcesCount && sourcesCount > 0 && (
            <Badge variant="default" className="text-xs">
              {sourcesCount} sources
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}