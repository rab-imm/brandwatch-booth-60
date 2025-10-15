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

      // Check if user has required role for current page
      if (allowedRoles && !allowedRoles.includes(profile.user_role)) {
        toast.error('Access denied: You do not have permission to view this page')
        
        // Redirect to appropriate dashboard based on role
        if (profile.user_role === 'super_admin') {
          navigate('/admin')
        } else if (profile.user_role === 'company_admin') {
          navigate('/company-admin')
        } else if (profile.user_role === 'company_staff' || profile.user_role === 'company_manager') {
          navigate('/company-user')
        } else {
          navigate('/dashboard')
        }
        return
      }

      // Auto-redirect based on user role when on auth or root path
      if (currentPath === '/auth' || currentPath === '/') {
        if (profile.user_role === 'super_admin') {
          navigate('/admin')
        } else if (profile.user_role === 'company_admin') {
          navigate('/company-admin')
        } else if (profile.user_role === 'company_staff' || profile.user_role === 'company_manager') {
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
        
        if (profile.user_role === 'super_admin') {
          if (currentPath !== '/admin') navigate('/admin')
        } else if (profile.user_role === 'company_admin') {
          if (currentPath !== '/company-admin') navigate('/company-admin')
        } else if (profile.user_role === 'company_staff' || profile.user_role === 'company_manager') {
          if (currentPath !== '/company-user') navigate('/company-user')
        } else if (profile.user_role === 'individual') {
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