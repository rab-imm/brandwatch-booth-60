import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icon } from "@/components/ui/Icon"
import { useTranslation } from 'react-i18next'

export const ThreeModePipeline = () => {
  const { t } = useTranslation()
  
  const steps = [
    {
      number: "1",
      icon: "message-circle",
      title: t('threeModes.step1Title'),
      description: t('threeModes.step1Desc'),
      example: t('threeModes.step1Example')
    },
    {
      number: "2", 
      icon: "brain",
      title: t('threeModes.step2Title'),
      description: t('threeModes.step2Desc'),
      example: t('threeModes.step2Example')
    },
    {
      number: "3",
      icon: "file-text",
      title: t('threeModes.step3Title'),
      description: t('threeModes.step3Desc'),
      example: t('threeModes.step3Example')
    }
  ]

  return (
    <section className="py-20 px-6 bg-brand-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            {t('threeModes.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('threeModes.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="p-8 bg-card border-dashboard-border hover:shadow-dashboard transition-all duration-300 relative">
              {/* Step Number */}
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold text-sm">
                  {step.number}
                </div>
              </div>
              
              <div className="space-y-6 pt-4">
                <div className="w-16 h-16 rounded-xl bg-brand-warm/20 flex items-center justify-center">
                  <Icon name={step.icon} size={28} className="text-brand-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                  </p>
                  <div className="bg-brand-warm/10 rounded-lg p-3 border border-brand-warm/20">
                    <p className="text-sm text-brand-primary font-medium">
                      {step.example}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="premium" size="lg" className="group">
            {t('threeModes.tryFirstQuestion')}
            <Icon name="arrow-right" size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            {t('threeModes.freeInfo')}
          </p>
        </div>
      </div>
    </section>
  )
}