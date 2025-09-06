import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import brandMonitoring from "@/assets/brand-monitoring.jpg"
import competitiveIntel from "@/assets/competitive-intel.jpg"

export const DashboardPreview = () => {
  const [animatedMetrics, setAnimatedMetrics] = useState({
    sentiment: 0,
    mentions: 0,
    reach: 0,
    marketShare: 0,
    competitors: 0,
    alerts: 0
  })

  useEffect(() => {
    const targets = {
      sentiment: 15,
      mentions: 2847,
      reach: 1.2,
      marketShare: 23.7,
      competitors: 47,
      alerts: 3
    }

    Object.keys(targets).forEach((key, index) => {
      setTimeout(() => {
        const target = targets[key as keyof typeof targets]
        let current = 0
        const increment = target / 60

        const counter = setInterval(() => {
          current += increment
          if (current >= target) {
            current = target
            clearInterval(counter)
          }
          setAnimatedMetrics(prev => ({
            ...prev,
            [key]: current
          }))
        }, 16)
      }, index * 300)
    })
  }, [])

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Real-time Insights
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
              Intelligence that drives decisions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get comprehensive brand analytics with AI-powered insights 
              delivered through intuitive dashboards designed for action.
            </p>
          </motion.div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Brand Monitoring Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
          <Card className="p-8 bg-gradient-dashboard border-dashboard-border shadow-card hover:shadow-elevated transition-all duration-300">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon name="alert-circle" className="h-5 w-5 text-brand-accent" />
                    <h3 className="text-xl font-semibold text-brand-primary">Brand Monitoring</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Track sentiment across social media, news, and review platforms 
                    with real-time alerts and trend analysis.
                  </p>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden shadow-soft">
                <img 
                  src={brandMonitoring} 
                  alt="Brand monitoring dashboard showing sentiment analysis and social media metrics" 
                  className="w-full h-48 object-cover"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  className="text-center p-3 rounded-lg bg-gradient-to-br from-pastel-mint/20 to-pastel-mint/10 border border-pastel-mint/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="flex items-center justify-center mb-1">
                    <Icon name="trending-up" className="h-4 w-4 text-green-600" />
                    <Icon name="activity" className="h-3 w-3 text-green-600 ml-1 animate-pulse" />
                  </div>
                  <div className="text-sm font-medium text-brand-primary">Sentiment</div>
                  <div className="text-xs text-muted-foreground">+{Math.round(animatedMetrics.sentiment)}% Positive</div>
                </motion.div>
                <motion.div 
                  className="text-center p-3 rounded-lg bg-gradient-to-br from-pastel-coral/20 to-pastel-coral/10 border border-pastel-coral/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="text-sm font-medium text-brand-primary">Mentions</div>
                  <div className="text-xs text-muted-foreground">{Math.round(animatedMetrics.mentions).toLocaleString()} today</div>
                </motion.div>
                <motion.div 
                  className="text-center p-3 rounded-lg bg-gradient-to-br from-pastel-lavender/20 to-pastel-lavender/10 border border-pastel-lavender/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="text-sm font-medium text-brand-primary">Reach</div>
                  <div className="text-xs text-muted-foreground">{animatedMetrics.reach.toFixed(1)}M people</div>
                </motion.div>
              </div>
            </div>
          </Card>
          </motion.div>
          
          {/* Competitive Intelligence Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
          <Card className="p-8 bg-gradient-dashboard border-dashboard-border shadow-card hover:shadow-elevated transition-all duration-300">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon name="bar-chart-3" className="h-5 w-5 text-brand-accent" />
                    <h3 className="text-xl font-semibold text-brand-primary">Competitive Intelligence</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Analyze competitor performance, market share, and strategic moves 
                    to stay ahead of industry trends.
                  </p>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden shadow-soft">
                <img 
                  src={competitiveIntel} 
                  alt="Competitive intelligence dashboard with market share and competitor analysis" 
                  className="w-full h-48 object-cover"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  className="text-center p-3 rounded-lg bg-gradient-to-br from-brand-accent/20 to-brand-accent/10 border border-brand-accent/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="flex items-center justify-center mb-1">
                    <Icon name="users" className="h-4 w-4 text-brand-accent" />
                  </div>
                  <div className="text-sm font-medium text-brand-primary">Market Share</div>
                  <div className="text-xs text-muted-foreground">{animatedMetrics.marketShare.toFixed(1)}% (+2.1%)</div>
                </motion.div>
                <motion.div 
                  className="text-center p-3 rounded-lg bg-gradient-to-br from-pastel-mint/20 to-pastel-mint/10 border border-pastel-mint/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="text-sm font-medium text-brand-primary">Competitors</div>
                  <div className="text-xs text-muted-foreground">{Math.round(animatedMetrics.competitors)} tracked</div>
                </motion.div>
                <motion.div 
                  className="text-center p-3 rounded-lg bg-gradient-to-br from-pastel-coral/20 to-pastel-coral/10 border border-pastel-coral/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="text-sm font-medium text-brand-primary">Alerts</div>
                  <div className="text-xs text-muted-foreground">{Math.round(animatedMetrics.alerts)} new today</div>
                </motion.div>
              </div>
            </div>
          </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}