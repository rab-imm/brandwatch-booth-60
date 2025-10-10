import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { useTranslation } from 'react-i18next'

export const LegalDisclaimers = () => {
  const { t } = useTranslation()
  
  const disclaimers = [
    {
      icon: "info-circle",
      title: t('legalDisclaimers.disclaimer1Title'),
      description: t('legalDisclaimers.disclaimer1Desc')
    },
    {
      icon: "user-check",
      title: t('legalDisclaimers.disclaimer2Title'),
      description: t('legalDisclaimers.disclaimer2Desc')
    },
    {
      icon: "shield-off",
      title: t('legalDisclaimers.disclaimer3Title'),
      description: t('legalDisclaimers.disclaimer3Desc')
    },
    {
      icon: "alert-triangle",
      title: t('legalDisclaimers.disclaimer4Title'),
      description: t('legalDisclaimers.disclaimer4Desc')
    }
  ]

  return (
    <section className="py-20 px-6 bg-brand-warm/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            {t('legalDisclaimers.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('legalDisclaimers.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {disclaimers.map((disclaimer, index) => (
            <Card key={index} className="p-6 bg-card border-dashboard-border">
              <div className="flex space-x-4">
                <div className="w-12 h-12 rounded-lg bg-brand-warm/20 flex items-center justify-center flex-shrink-0">
                  <Icon name={disclaimer.icon} size={20} className="text-brand-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-primary mb-2">
                    {disclaimer.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {disclaimer.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-8 bg-gradient-to-br from-brand-secondary/10 to-brand-accent/5 border-brand-secondary/20">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto">
              <Icon name="scale" size={28} className="text-brand-accent" />
            </div>
            <h3 className="text-2xl font-bold text-brand-primary">
              {t('legalDisclaimers.whenToConsult')}
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[
                t('legalDisclaimers.situation1'),
                t('legalDisclaimers.situation2'),
                t('legalDisclaimers.situation3'),
                t('legalDisclaimers.situation4'),
                t('legalDisclaimers.situation5'),
                t('legalDisclaimers.situation6')
              ].map((situation, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Icon name="check" size={16} className="text-brand-accent flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{situation}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
              {t('legalDisclaimers.consultDesc')}
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}