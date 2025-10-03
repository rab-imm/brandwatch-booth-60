import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    } else if (!loading && user) {
      const currentPath = window.location.pathname
      if (currentPath === '/auth' || currentPath === '/') {
        // Auto-redirect based on user role after successful auth
        if (profile?.role === 'super_admin') {
          navigate('/admin')
        } else if (profile?.role === 'company_admin') {
          navigate('/company-admin')
        } else {
          navigate('/dashboard')
        }
      }
    }
  }, [user, loading, profile, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}