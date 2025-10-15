import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { NotificationCenter } from "@/components/NotificationCenter"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Header = () => {
  const { user, signOut, profile } = useAuth();
  const { t } = useTranslation();

  const getDashboardLink = () => {
    const primaryRole = profile?.primary_role
    
    if (primaryRole === 'super_admin') return '/admin'
    if (primaryRole === 'company_admin') return '/company-admin'
    if (primaryRole === 'company_staff' || primaryRole === 'company_manager') return '/company-user'
    return '/dashboard'
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          <Link to="/" className="text-2xl font-bold text-brand-primary font-pact-display whitespace-nowrap">UAE Legal Research</Link>
          
          {user && (
            <nav className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border">
              <Link 
                to={getDashboardLink()} 
                className="text-sm font-medium px-6 py-2 rounded-md hover:bg-background transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to="/templates" 
                className="text-sm font-medium px-6 py-2 rounded-md hover:bg-background transition-colors"
              >
                Templates
              </Link>
              <Link 
                to="/letters" 
                className="text-sm font-medium px-6 py-2 rounded-md hover:bg-background transition-colors"
              >
                My Letters
              </Link>
              <Link 
                to="/ocr" 
                className="text-sm font-medium px-6 py-2 rounded-md hover:bg-background transition-colors"
              >
                OCR Scanner
              </Link>
            </nav>
          )}

          {!user && (
            <nav className="flex items-center space-x-6">
              <Link to="/features" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.features')}
              </Link>
              <Link to="/templates" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.templates')}
              </Link>
              <Link to="/pricing" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.pricing')}
              </Link>
              <Link to="/use-cases" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.useCases')}
              </Link>
              <Link to="/about" className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.about')}
              </Link>
            </nav>
          )}
          
          <div className="flex items-center space-x-4 ml-auto">
            {user ? (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/subscription">{t('nav.subscription')}</Link>
                </Button>
                {profile?.roles?.includes('super_admin') && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">{t('nav.admin')}</Link>
                  </Button>
                )}
                {profile?.roles?.includes('company_admin') && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/company-admin">{t('nav.admin')}</Link>
                  </Button>
                )}
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  {t('common.signOut')}
                </Button>
                <NotificationCenter />
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">{t('common.signIn')}</Link>
                </Button>
                <Button variant="premium" size="sm" asChild>
                  <Link to="/auth">{t('common.startTrial')}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}