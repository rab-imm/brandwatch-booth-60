import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { NotificationCenter } from "@/components/NotificationCenter"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Header = () => {
  const { user, signOut, profile, refetchProfile } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleResetQueries = async () => {
    setResetting(true);
    try {
      const { error } = await supabase.rpc('reset_user_queries')
      if (error) throw error
      
      await refetchProfile()
      toast.success('Queries reset successfully!')
    } catch (error) {
      console.error('Error resetting queries:', error)
      toast.error('Failed to reset queries')
    } finally {
      setResetting(false);
    }
  }
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-brand-primary font-pact-display">UAE Legal Research</Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/features" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link to="/templates" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Templates
              </Link>
              <Link to="/pricing" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/use-cases" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Use Cases
              </Link>
              <Link to="/about" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              
              {/* Resources Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  Resources
                  <Icon name="chevron-down" size={12} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border border-border">
                  <DropdownMenuItem asChild>
                    <Link to="/resources#blog">Blog</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/resources#help">Help Center</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/resources#docs">API Docs</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/resources#status">Status Page</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <NotificationCenter />
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/subscription">Subscription</Link>
                </Button>
                {profile?.user_role === 'super_admin' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">Admin</Link>
                  </Button>
                )}
                {/* Temporary Reset Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetQueries}
                  disabled={resetting}
                  className="bg-yellow-500/10 border-yellow-500/20 text-yellow-700 hover:bg-yellow-500/20 disabled:opacity-50"
                >
                  {resetting ? (
                    <Icon name="loader" size={14} className="mr-1 animate-spin" />
                  ) : (
                    <Icon name="refresh-cw" size={14} className="mr-1" />
                  )}
                  {resetting ? 'Resetting...' : 'Reset Queries'}
                </Button>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="premium" size="sm" asChild>
                  <Link to="/auth">Try Free Queries</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}