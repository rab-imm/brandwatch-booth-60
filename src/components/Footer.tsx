import { Icon } from "@/components/ui/Icon"
import { Link } from "react-router-dom"
import { useTranslation } from 'react-i18next'

export const Footer = () => {
  const { t } = useTranslation()
  return (
    <footer className="border-t border-border py-12 px-6 bg-card">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-brand-primary mb-4">graysen</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              {t('footer.description')}
            </p>
            
            {/* Newsletter Signup */}
            <div className="mb-6">
              <div className="flex max-w-md gap-2">
                <input 
                  type="email" 
                  placeholder={t('footer.emailPlaceholder')}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  {t('footer.subscribe')}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Get weekly legal insights</p>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mb-4">
              <a href="https://twitter.com/uaelegalresearch" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="brand-twitter" size={20} />
              </a>
              <a href="https://linkedin.com/company/uaelegalresearch" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="brand-linkedin" size={20} />
              </a>
              <a href="https://facebook.com/uaelegalresearch" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="brand-facebook" size={20} />
              </a>
            </div>

            <div className="flex space-x-4 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.privacyPolicy')}
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.termsOfService')}
              </a>
              <a href="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.security')}
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-brand-primary mb-4">{t('footer.product')}</h4>
            <div className="space-y-2">
              <Link to="/features" className="block text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.features')}
              </Link>
              <Link to="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.pricing')}
              </Link>
              <Link to="/use-cases" className="block text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.useCases')}
              </Link>
              <Link to="/features#integrations" className="block text-muted-foreground hover:text-foreground transition-colors">
                Integrations
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-brand-primary mb-4">{t('footer.resources')}</h4>
            <div className="space-y-2">
              <Link to="/resources#blog" className="block text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link to="/resources#help" className="block text-muted-foreground hover:text-foreground transition-colors">
                Help Center
              </Link>
              <Link to="/resources#docs" className="block text-muted-foreground hover:text-foreground transition-colors">
                API Docs
              </Link>
              <Link to="/resources#status" className="block text-muted-foreground hover:text-foreground transition-colors">
                Status Page
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.about')}
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Icon name="shield" size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('footer.builtFor')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}