import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import heroImage from "@/assets/uae-legal-hero.jpg"
import { useTranslation } from 'react-i18next'

export const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 px-6 bg-gradient-warm">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-brand-primary font-pact-display tracking-tight">
                {t('hero.title')}
                <span className="block text-brand-accent">{t('hero.titleAccent')}</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg font-pact-body">
                {t('hero.subtitle')}
              </p>
              <div className="bg-brand-warm/20 rounded-lg p-4 border border-brand-warm/30">
                <p className="text-lg font-semibold text-brand-primary mb-1">
                  {t('hero.freeQueries')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('hero.freeQueriesDesc')}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="premium" size="lg" className="group" asChild>
                <a href="#chat-demo">
                  {t('hero.tryFree')}
                  <Icon name="arrow-right" size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="group" asChild>
                <a href="/pricing">
                  <Icon name="message-circle" size={20} className="mr-2" />
                  {t('hero.seePricing')}
                </a>
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">50K+</div>
                <div className="text-sm text-muted-foreground">{t('hero.verifiedDocs')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">{t('hero.all')}</div>
                <div className="text-sm text-muted-foreground">{t('hero.allJurisdictions')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">{t('hero.instant')}</div>
                <div className="text-sm text-muted-foreground">{t('hero.instantAnswers')}</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-dashboard">
              <img 
                src={heroImage} 
                alt="graysen Platform dashboard showing AI-powered document search and analysis" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/5 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}