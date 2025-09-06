import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@/components/ui/Icon"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const Resources = () => {
  const blogPosts = [
    {
      title: "The AI Content Revolution: What Agencies Need to Know",
      excerpt: "How artificial intelligence is transforming content creation and what it means for your agency's future.",
      date: "Dec 15, 2024",
      readTime: "8 min read",
      category: "AI Insights"
    },
    {
      title: "10x Content Output Without Burnout: A Case Study", 
      excerpt: "How Velocity Agency increased their content production by 1000% while reducing team stress.",
      date: "Dec 12, 2024",
      readTime: "6 min read",
      category: "Case Study"
    },
    {
      title: "Brand Guidelines in the AI Era",
      excerpt: "Maintaining brand consistency when AI is creating your content.",
      date: "Dec 8, 2024", 
      readTime: "5 min read",
      category: "Best Practices"
    }
  ]

  const helpTopics = [
    {
      title: "Getting Started",
      articles: 12,
      icon: "play",
      topics: ["Account Setup", "First Campaign", "Team Onboarding", "Brand Configuration"]
    },
    {
      title: "Content Creation",
      articles: 24,
      icon: "layers",
      topics: ["Video Generation", "Image Creation", "Copy Writing", "Multi-Format Campaigns"]
    },
    {
      title: "Workflow Management", 
      articles: 18,
      icon: "workflow",
      topics: ["Approval Process", "Team Collaboration", "Client Reviews", "Version Control"]
    },
    {
      title: "Integrations",
      articles: 15,
      icon: "link",
      topics: ["Slack Integration", "Publishing Platforms", "Analytics Tools", "CRM Systems"]
    }
  ]

  const apiSections = [
    {
      title: "Content Generation API",
      description: "Programmatically create content using our AI engine",
      endpoints: ["POST /generate/video", "POST /generate/image", "POST /generate/copy"]
    },
    {
      title: "Brand Management API",
      description: "Manage brand guidelines and asset libraries",
      endpoints: ["GET /brands", "POST /brands/{id}/assets", "PUT /brands/{id}/guidelines"]
    },
    {
      title: "Workflow API",
      description: "Integrate with your existing approval workflows", 
      endpoints: ["GET /campaigns", "POST /campaigns/{id}/approve", "GET /campaigns/{id}/status"]
    }
  ]

  const statusMetrics = [
    { label: "API Uptime", value: "99.98%", status: "operational" },
    { label: "Average Response Time", value: "234ms", status: "operational" }, 
    { label: "Content Generation", value: "Online", status: "operational" },
    { label: "CDN Performance", value: "Optimal", status: "operational" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-gradient-warm">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
              Resources & Support
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed with CreateAI
            </p>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-4 gap-8">
              <Card className="p-8 text-center bg-card hover:shadow-dashboard transition-all">
                <Icon name="book" size={32} className="mx-auto mb-4 text-brand-accent" />
                <h3 className="text-xl font-semibold text-brand-primary mb-2">Blog</h3>
                <p className="text-muted-foreground mb-4">AI + agency insights</p>
                <Button variant="outline">Read Blog</Button>
              </Card>
              
              <Card className="p-8 text-center bg-card hover:shadow-dashboard transition-all">
                <Icon name="help-circle" size={32} className="mx-auto mb-4 text-brand-accent" />
                <h3 className="text-xl font-semibold text-brand-primary mb-2">Help Center</h3>
                <p className="text-muted-foreground mb-4">FAQs, how-tos</p>
                <Button variant="outline">Get Help</Button>
              </Card>
              
              <Card className="p-8 text-center bg-card hover:shadow-dashboard transition-all">
                <Icon name="code" size={32} className="mx-auto mb-4 text-brand-accent" />
                <h3 className="text-xl font-semibold text-brand-primary mb-2">API Docs</h3>
                <p className="text-muted-foreground mb-4">For developers</p>
                <Button variant="outline">View Docs</Button>
              </Card>
              
              <Card className="p-8 text-center bg-card hover:shadow-dashboard transition-all">
                <Icon name="activity" size={32} className="mx-auto mb-4 text-brand-accent" />
                <h3 className="text-xl font-semibold text-brand-primary mb-2">Status Page</h3>
                <p className="text-muted-foreground mb-4">Uptime and incidents</p>
                <Button variant="outline">Check Status</Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="py-20 px-6 bg-brand-secondary/10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Latest from our Blog</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                AI + Agency Insights
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <Card key={index} className="p-6 bg-card hover:shadow-dashboard transition-all">
                  <Badge variant="outline" className="mb-3">{post.category}</Badge>
                  <h3 className="text-xl font-semibold text-brand-primary mb-3">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="premium" size="lg">
                View All Articles
              </Button>
            </div>
          </div>
        </section>

        {/* Help Center */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Help Center</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                Find Answers Fast
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {helpTopics.map((topic, index) => (
                <Card key={index} className="p-6 bg-card">
                  <Icon name={topic.icon} size={32} className="mb-4 text-brand-accent" />
                  <h3 className="text-lg font-semibold text-brand-primary mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {topic.articles} articles
                  </p>
                  <ul className="space-y-2">
                    {topic.topics.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* API Documentation */}
        <section className="py-20 px-6 bg-brand-secondary/10">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">API Documentation</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                Build with CreateAI
              </h2>
              <p className="text-xl text-muted-foreground">
                Integrate our AI content generation into your applications
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {apiSections.map((section, index) => (
                <Card key={index} className="p-6 bg-card">
                  <h3 className="text-xl font-semibold text-brand-primary mb-3">
                    {section.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {section.description}
                  </p>
                  <div className="space-y-2">
                    {section.endpoints.map((endpoint, i) => (
                      <div key={i} className="text-sm font-mono bg-muted p-2 rounded">
                        {endpoint}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="premium" size="lg">
                Explore API Docs
              </Button>
            </div>
          </div>
        </section>

        {/* Status Page */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">System Status</Badge>
              <h2 className="text-4xl font-bold mb-6 text-brand-primary font-pact-display">
                All Systems Operational
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {statusMetrics.map((metric, index) => (
                <Card key={index} className="p-6 bg-card">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-brand-primary">{metric.label}</h3>
                      <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                View Detailed Status
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Resources