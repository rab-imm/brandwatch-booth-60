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

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-brand-primary font-pact-display">UAE Legal Research</Link>
            
            {user && !profile?.current_company_id && (
              <nav className="hidden md:flex items-center space-x-2 bg-secondary/30 rounded-lg px-4 py-2">
                <Link 
                  to="/dashboard" 
                  className="text-sm font-medium px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
                <Link 
                  to="/templates" 
                  className="text-sm font-medium px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                >
                  {t('nav.templates')}
                </Link>
                <Link 
                  to="/letters" 
                  className="text-sm font-medium px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                >
                  {t('nav.letters')}
                </Link>
              </nav>
            )}

            {!user && (
              <nav className="hidden md:flex items-center space-x-6">
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
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/subscription">{t('nav.subscription')}</Link>
                </Button>
                {profile?.user_role === 'super_admin' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">{t('nav.admin')}</Link>
                  </Button>
                )}
                {profile?.user_role === 'company_admin' && (
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