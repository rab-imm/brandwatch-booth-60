import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslation } from 'react-i18next'

export const ProblemSection = () => {
  const { t } = useTranslation()
  
  const legalChallenges = [
    { challenge: t('problemSection.documentHunt'), task: t('problemSection.documentHuntDesc') },
    { challenge: t('problemSection.languageBarrier'), task: t('problemSection.languageBarrierDesc') },
    { challenge: t('problemSection.versionControl'), task: t('problemSection.versionControlDesc') },
    { challenge: t('problemSection.citationAccuracy'), task: t('problemSection.citationAccuracyDesc') },
    { challenge: t('problemSection.complianceRisk'), task: t('problemSection.complianceRiskDesc') }
  ]

  return (
    <section className="py-20 px-6 bg-brand-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            {t('problemSection.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            {t('problemSection.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-12">
          {legalChallenges.map((challenge, index) => (
            <Card key={index} className="p-6 bg-card shadow-soft border-dashboard-border text-center">
              <div className="text-lg font-semibold text-brand-accent mb-2">{challenge.challenge}</div>
              <p className="text-sm text-muted-foreground">{challenge.task}</p>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-6">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('problemSection.meanwhile')}
          </p>
          <Button variant="premium" size="lg">
            {t('problemSection.seeSolution')}
          </Button>
        </div>
      </div>
    </section>
  )
}