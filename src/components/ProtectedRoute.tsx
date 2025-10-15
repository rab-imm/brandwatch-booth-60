import { useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
      return
    }

    if (!loading && user && profile) {
      const currentPath = window.location.pathname
      const userRoles = profile.roles || []
      const primaryRole = profile.primary_role || profile.user_role

      // Check if user has required role for current page
      if (allowedRoles && userRoles.length > 0) {
        const hasAccess = userRoles.some(role => allowedRoles.includes(role))
        
        if (!hasAccess) {
          toast.error('Access denied: You do not have permission to view this page')
          
          // Redirect to appropriate dashboard based on PRIMARY role
          if (primaryRole === 'super_admin') {
            navigate('/admin')
          } else if (primaryRole === 'company_admin') {
            navigate('/company-admin')
          } else if (primaryRole === 'company_staff' || primaryRole === 'company_manager') {
            navigate('/company-user')
          } else {
            navigate('/dashboard')
          }
          return
        }
      }

      // Auto-redirect based on user role when on auth or root path
      if (currentPath === '/auth' || currentPath === '/') {
        if (primaryRole === 'super_admin') {
          navigate('/admin')
        } else if (primaryRole === 'company_admin') {
          navigate('/company-admin')
        } else if (primaryRole === 'company_staff' || primaryRole === 'company_manager') {
          navigate('/company-user')
        } else {
          navigate('/dashboard')
        }
        return
      }

      // Only enforce strict routing for role-specific dashboard pages
      const isDashboardRoute = ['/admin', '/company-admin', '/company-user', '/dashboard'].includes(currentPath)

      if (isDashboardRoute) {
        // Redirect to correct dashboard if on wrong one
        let correctDashboard = '/dashboard'
        
        if (primaryRole === 'super_admin') {
          correctDashboard = '/admin'
        } else if (primaryRole === 'company_admin') {
          correctDashboard = '/company-admin'
        } else if (primaryRole === 'company_staff' || primaryRole === 'company_manager') {
          correctDashboard = '/company-user'
        }
        
        if (currentPath !== correctDashboard) {
          navigate(correctDashboard)
          return
        }
      }
    }
  }, [user, loading, profile, navigate, allowedRoles])

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