import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { useTranslation } from 'react-i18next'

export const UseCases = () => {
  const { t } = useTranslation()
  
  const useCases = [
    {
      title: t('useCases.contractAnalysis'),
      subtitle: t('useCases.commercialLaw'),
      description: t('useCases.contractAnalysisDesc'),
      cta: t('useCases.contractAnalysisCta'),
      icon: "file-text",
      gradient: "bg-gradient-to-br from-brand-primary/10 to-brand-accent/10"
    },
    {
      title: t('useCases.regulatoryCompliance'), 
      subtitle: t('useCases.multiJurisdiction'),
      description: t('useCases.regulatoryComplianceDesc'),
      cta: t('useCases.regulatoryComplianceCta'),
      icon: "shield-check",
      gradient: "bg-gradient-to-br from-brand-accent/10 to-brand-warm/20"
    },
    {
      title: t('useCases.legalDueDiligence'),
      subtitle: t('useCases.corporateLaw'), 
      description: t('useCases.legalDueDiligenceDesc'),
      cta: t('useCases.legalDueDiligenceCta'),
      icon: "search",
      gradient: "bg-gradient-to-br from-brand-warm/20 to-brand-secondary/10"
    },
    {
      title: t('useCases.litigationSupport'),
      subtitle: t('useCases.caseResearch'),
      description: t('useCases.litigationSupportDesc'),
      cta: t('useCases.litigationSupportCta'), 
      icon: "gavel",
      gradient: "bg-gradient-to-br from-brand-secondary/10 to-brand-primary/10"
    }
  ]

  return (
    <section id="use-cases" className="py-20 px-6 bg-brand-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {t('useCases.badge')}
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            {t('useCases.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('useCases.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <Card key={index} className={`p-8 ${useCase.gradient} border-dashboard-border hover:shadow-dashboard transition-all duration-300`}>
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-xl bg-brand-warm flex items-center justify-center">
                    <Icon name={useCase.icon} size={28} className="text-brand-accent" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {useCase.subtitle}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {useCase.description}
                  </p>
                </div>
                
                <Button variant="outline" className="w-full">
                  {useCase.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}