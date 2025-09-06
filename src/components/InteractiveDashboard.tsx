import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartDonut } from '@/components/charts/ChartDonut'
import { ChartLine } from '@/components/charts/ChartLine'  
import { ChartArea } from '@/components/charts/ChartArea'
import { Icon } from "@/components/ui/Icon"
import { chartSchemes } from "@/components/ui/chartTheme"

const sentimentData = [
  { month: 'Mon', positive: 65, negative: 25, neutral: 10 },
  { month: 'Tue', positive: 72, negative: 18, neutral: 10 },
  { month: 'Wed', positive: 68, negative: 22, neutral: 10 },
  { month: 'Thu', positive: 75, negative: 15, neutral: 10 },
  { month: 'Fri', positive: 80, negative: 12, neutral: 8 },
  { month: 'Sat', positive: 78, negative: 14, neutral: 8 },
  { month: 'Sun', positive: 82, negative: 10, neutral: 8 },
]

const engagementData = [
  { week: 'Week 1', likes: 4200, shares: 1200, comments: 800 },
  { week: 'Week 2', likes: 8900, shares: 2100, comments: 1500 },
  { week: 'Week 3', likes: 6500, shares: 1800, comments: 1100 },
  { week: 'Week 4', likes: 12400, shares: 3200, comments: 2100 },
  { week: 'Week 5', likes: 9800, shares: 2800, comments: 1800 },
  { week: 'Week 6', likes: 3200, shares: 900, comments: 600 },
]

const marketShareData = [
  { name: "Product A", value: 35 },
  { name: "Product B", value: 28 },
  { name: "Product C", value: 22 },
  { name: "Product D", value: 15 },
  { name: "Others", value: 8 },
]

const metrics = [
  { 
    icon: 'trending-up', 
    label: "Revenue Growth", 
    value: 12.5, 
    change: "+2.1%", 
    color: chartSchemes.performance[0]
  },
  { 
    icon: 'users', 
    label: "Active Users", 
    value: 8749, 
    change: "+12.3%", 
    color: chartSchemes.engagement[0]
  },
  { 
    icon: 'message-circle', 
    label: "Conversions", 
    value: 24.8, 
    change: "+4.2%", 
    color: chartSchemes.growth[0]
  },
  { 
    icon: 'globe', 
    label: "Revenue", 
    value: 45621, 
    change: "+8.7%", 
    color: chartSchemes.performance[1]
  },
]

export const InteractiveDashboard = () => {
  const [activeChart, setActiveChart] = useState('sentiment')
  const [animatedValues, setAnimatedValues] = useState(metrics.map(() => 0))

  useEffect(() => {
    const timers = metrics.map((metric, index) => {
      return setTimeout(() => {
        const targetValue = metric.value as number
        
        let currentValue = 0
        const increment = targetValue / 50
        const counter = setInterval(() => {
          currentValue += increment
          if (currentValue >= targetValue) {
            currentValue = targetValue
            clearInterval(counter)
          }
          setAnimatedValues(prev => {
            const newValues = [...prev]
            newValues[index] = currentValue
            return newValues
          })
        }, 30)
      }, index * 200)
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4">
              Live Analytics
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
              Data that drives growth
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real-time analytics and AI-powered insights to help you understand 
              your brand performance and stay ahead of the competition.
            </p>
          </motion.div>
        </div>

        {/* Metrics Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {metrics.map((metric, index) => (
            <motion.div key={metric.label} whileHover={{ scale: 1.02 }}>
              <Card className="p-6 bg-card border-border shadow-soft hover:shadow-elevated transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-background to-muted/50">
                    <Icon name={metric.icon} className="h-6 w-6" style={{ color: metric.color }} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {metric.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                  <p className="text-2xl font-bold text-brand-primary">
                    {typeof metric.value === 'number' && metric.value > 1000
                      ? Math.round(animatedValues[index]).toLocaleString()
                      : animatedValues[index].toFixed(1)
                    }
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Chart Controls */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex space-x-2 p-1 bg-muted rounded-lg">
            <Button
              variant={activeChart === 'sentiment' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveChart('sentiment')}
              className="text-sm"
            >
              Sentiment Analysis
            </Button>
            <Button
              variant={activeChart === 'engagement' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveChart('engagement')}
              className="text-sm"
            >
              Engagement Trends
            </Button>
            <Button
              variant={activeChart === 'marketShare' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveChart('marketShare')}
              className="text-sm"
            >
              Market Share
            </Button>
          </div>
        </motion.div>

        {/* Interactive Charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 bg-card border-border shadow-soft">
            {activeChart === 'sentiment' && (
              <div>
                <h3 className="text-xl font-semibold mb-6 text-brand-primary">Weekly Sentiment Analysis</h3>
                <div className="h-80">
                  <ChartArea
                    data={sentimentData}
                    dataKeys={['positive', 'neutral', 'negative']}
                    xAxisKey="month"
                    stacked={true}
                    useGradient={true}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {activeChart === 'engagement' && (
              <div>
                <h3 className="text-xl font-semibold mb-6 text-brand-primary">Daily Engagement Pattern</h3>
                <div className="h-80">
                  <ChartLine
                    data={engagementData}
                    dataKeys={['likes', 'shares', 'comments']}
                    xAxisKey="week"
                    curved={true}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {activeChart === 'marketShare' && (
              <div>
                <h3 className="text-xl font-semibold mb-6 text-brand-primary">Market Share Distribution</h3>
                <div className="h-80">
                  <ChartDonut
                    data={marketShareData}
                    showLegend={true}
                    centerLabel="Total Market"
                    centerValue="100%"
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </section>
  )
}