import { Component, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Admin Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Icon name="alert-triangle" className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              An error occurred while loading this admin panel. This might be due to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Database connection issues</li>
              <li>Permission restrictions</li>
              <li>Network connectivity problems</li>
            </ul>
            <Button 
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
              className="w-full"
            >
              <Icon name="refresh-cw" className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}