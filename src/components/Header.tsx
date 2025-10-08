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
  const { user, signOut, profile } = useAuth();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-brand-primary font-pact-display">UAE Legal Research</Link>
            <nav className="hidden md:flex items-center space-x-6">
              {!user ? (
                <>
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
                </>
              ) : profile?.current_company_id ? (
                <>
                  {/* Company users - no personal navigation in header, use sidebar instead */}
                  <Link to="/templates" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    Templates
                  </Link>
                </>
              ) : (
                <>
                  {/* Personal users - show personal navigation */}
                  <Link to="/dashboard" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/letters" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    My Letters
                  </Link>
                  <Link to="/templates" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    Templates
                  </Link>
                </>
              )}
              
              {/* Resources Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  Resources
                  <Icon name="chevron-down" size={12} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border border-border z-50">
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
                  <Link to="/subscription">Subscription</Link>
                </Button>
                {profile?.user_role === 'super_admin' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">Super Admin</Link>
                  </Button>
                )}
                {profile?.user_role === 'company_admin' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/company-admin">Company Admin</Link>
                  </Button>
                )}
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