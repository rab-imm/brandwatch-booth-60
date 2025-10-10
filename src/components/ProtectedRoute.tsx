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
    } else if (!loading && user && profile) {
      const currentPath = window.location.pathname
      // Auto-redirect based on user role when on auth or root path
      if (currentPath === '/auth' || currentPath === '/') {
        if (profile?.user_role === 'super_admin') {
          navigate('/admin')
        } else if (profile?.user_role === 'company_admin') {
          navigate('/company-admin')
        } else if (profile?.user_role === 'company_staff' || profile?.user_role === 'company_manager') {
          navigate('/company-user')
        } else {
          navigate('/dashboard')
        }
      }
      // Redirect to appropriate dashboard if user lands on /dashboard but has a specific role
      else if (currentPath === '/dashboard' || currentPath === '/company-dashboard') {
        if (profile?.user_role === 'super_admin') {
          navigate('/admin')
        } else if (profile?.user_role === 'company_admin') {
          navigate('/company-admin')
        } else if (profile?.user_role === 'company_staff' || profile?.user_role === 'company_manager') {
          navigate('/company-user')
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