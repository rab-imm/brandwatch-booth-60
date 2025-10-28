import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"
import { useTranslation } from 'react-i18next'

export const Features = () => {
  const { t } = useTranslation()
  const features = [
    {
      icon: "globe",
      title: "Comprehensive Coverage",
      description: "Access federal laws, emirate regulations, DIFC/ADGM rules, and free zone legislation in one platform.",
      cta: "Browse All Sources"
    },
    {
      icon: "language",
      title: "Arabic & English",
      description: "Advanced OCR and translation for Arabic legal documents with accurate legal terminology.",
      cta: "See Translation Quality"
    },
    {
      icon: "brain",
      title: "AI Legal Assistant",
      description: "Chat with AI that understands UAE law context, precedents, and regulatory relationships.",
      cta: "Try Legal Assistant"
    },
    {
      icon: "shield-check",
      title: "Verified Citations",
      description: "Every answer includes proper legal citations with direct links to source documents.",
      cta: "See Citation Format"
    },
    {
      icon: "alert-triangle",
      title: "Risk Assessment",
      description: "AI evaluates legal risks and provides compliance guidance for business decisions.",
      cta: "View Risk Analysis"
    },
    {
      icon: "clock",
      title: "Real-time Updates",
      description: "Continuous monitoring for amendments, new regulations, and regulatory changes.",
      cta: "Monitor Changes"
    },
    {
      icon: "download",
      title: "Export & Reports",
      description: "Generate legal research reports, export documents, and create client-ready summaries.",
      cta: "Create Reports"
    }
  ]

  const stats = [
    { icon: "clock", label: "Research Time", value: "90% faster" },
    { icon: "file-text", label: "Legal Documents", value: "50K+" },
    { icon: "target", label: "Query → Answer", value: "< 30 sec" },
    { icon: "check", label: "Citation Accuracy", value: "99.8%" }
  ]

  return (
    <section id="features" className="py-20 px-6 bg-brand-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Complete graysen Platform
          </Badge>
          <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            Everything Legal Professionals Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From comprehensive document coverage to AI-powered analysis, our platform provides 
            the complete toolkit for modern legal research in the UAE.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 text-center bg-card shadow-soft border-dashboard-border">
              <Icon name={stat.icon} size={32} className="mx-auto mb-3 text-brand-accent" />
              <div className="text-2xl font-bold text-brand-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-8 bg-card shadow-card border-dashboard-border hover:shadow-dashboard transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-warm flex items-center justify-center">
                  <Icon name={feature.icon} size={24} className="text-brand-accent" />
                </div>
                <h3 className="text-xl font-semibold text-brand-primary">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>
                <Button variant="outline" size="sm">
                  {feature.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}