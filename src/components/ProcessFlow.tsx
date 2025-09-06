import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { IconBadge } from "@/components/ui/IconBadge"

const steps = [
  {
    icon: "database",
    title: "Data Collection",
    description: "Aggregate data from 50+ sources including social media, news, reviews, and forums",
    features: ["Real-time monitoring", "Multi-platform coverage", "Historical data"]
  },
  {
    icon: "brain",
    title: "AI Processing", 
    description: "Advanced NLP and machine learning algorithms analyze sentiment, trends, and insights",
    features: ["Sentiment analysis", "Trend detection", "Anomaly identification"]
  },
  {
    icon: "trending-up",
    title: "Intelligence Generation",
    description: "Transform raw data into actionable insights and competitive intelligence reports",
    features: ["Predictive analytics", "Competitor tracking", "Market analysis"]
  },
  {
    icon: "target",
    title: "Strategic Actions",
    description: "Receive personalized recommendations and alerts to guide business decisions",
    features: ["Custom dashboards", "Automated alerts", "Strategic insights"]
  }
]

const benefits = [
  { icon: "lightning", title: "10x Faster", description: "Instant insights vs weeks of manual analysis" },
  { icon: "shield", title: "99.9% Accurate", description: "AI-powered precision with human validation" },
  { icon: "globe", title: "Global Coverage", description: "Monitor 47+ countries and 12 languages" },
  { icon: "bar-chart-3", title: "360° View", description: "Complete brand and competitor landscape" }
]

export const ProcessFlow = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
              From data to decisions in seconds
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our intelligent platform transforms millions of data points into 
              clear, actionable insights that drive your brand forward.
            </p>
          </motion.div>
        </div>

        {/* Process Flow */}
        <div className="relative mb-20">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-pastel-mint via-pastel-sage to-pastel-coral opacity-50 transform -translate-y-1/2" />
          
          <div className="grid lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className="p-8 bg-card border-border shadow-soft hover:shadow-elevated transition-all duration-300 relative z-10">
                  <motion.div 
                    className="mb-6"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="relative">
                      <IconBadge
                        icon={step.icon}
                        tone="sage"
                        size="lg"
                        className="mb-4"
                      />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-pastel-coral rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                    </div>
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-brand-primary">{step.title}</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{step.description}</p>
                  
                  <div className="space-y-2">
                    {step.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-pastel-mint" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <motion.div 
                    className="hidden lg:block absolute top-1/2 -right-4 z-20 transform -translate-y-1/2"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: (index * 0.2) + 0.4 }}
                    viewport={{ once: true }}
                  >
                    <IconBadge
                      icon="arrow-right"
                      tone="peach"
                      size="sm"
                      className="border-2 border-pastel-sage"
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-brand-primary mb-4 font-pact-display">
              Why leading brands choose us
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Experience the advantage of AI-powered brand intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-border shadow-soft text-center">
                  <IconBadge
                    icon={benefit.icon}
                    tone="sage"
                    size="md"
                    className="mx-auto mb-4"
                  />
                  <h4 className="text-lg font-semibold text-brand-primary mb-2">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}