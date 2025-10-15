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

      // Enforce role-based routing for all dashboard and admin pages
      if (currentPath.includes('/dashboard') || 
          currentPath.includes('/company-') ||
          currentPath === '/personal-dashboard' ||
          currentPath === '/admin') {
        
        if (primaryRole === 'super_admin') {
          if (currentPath !== '/admin') navigate('/admin')
        } else if (primaryRole === 'company_admin') {
          if (currentPath !== '/company-admin') navigate('/company-admin')
        } else if (primaryRole === 'company_staff' || primaryRole === 'company_manager') {
          if (currentPath !== '/company-user') navigate('/company-user')
        } else if (primaryRole === 'individual') {
          if (currentPath !== '/dashboard' && currentPath !== '/personal-dashboard') {
            navigate('/dashboard')
          }
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