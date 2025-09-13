import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"

export const ChatPreview = () => {
  const chatExample = [
    {
      type: "user",
      message: "Can my employer terminate me for being sick with a medical certificate?"
    },
    {
      type: "ai",
      message: "Based on UAE Employment Law, an employer cannot terminate an employee during sick leave if you have a valid medical certificate. Here's what the law says:",
      citations: [
        { title: "UAE Labour Law Article 84", link: "#" },
        { title: "Ministerial Resolution 279/2020", link: "#" }
      ],
      details: [
        "✓ Medical leave with certificate is protected",
        "✓ Maximum 90 days sick leave per year", 
        "✓ First 15 days are paid leave",
        "⚠️ Certificate must be from licensed doctor"
      ]
    }
  ]

  return (
    <section id="chat-demo" className="py-20 px-6 bg-brand-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-brand-primary font-pact-display tracking-tight">
            See How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ask any UAE legal question and get instant, accurate answers with verified citations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Chat Interface Mock */}
          <div className="space-y-6">
            <Card className="p-6 bg-card border-dashboard-border">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
                      <Icon name="message-circle" size={16} className="text-white" />
                    </div>
                    <span className="font-semibold text-brand-primary">UAE Legal AI</span>
                  </div>
                  <div className="text-xs text-muted-foreground bg-brand-warm/20 px-2 py-1 rounded">
                    2 queries remaining this month
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {chatExample.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-4 ${
                        msg.type === 'user' 
                          ? 'bg-brand-accent text-white' 
                          : 'bg-muted border border-border'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        
                        {msg.type === 'ai' && (
                          <div className="mt-4 space-y-3">
                            {/* Details */}
                            <div className="space-y-1">
                              {msg.details?.map((detail, i) => (
                                <p key={i} className="text-xs text-muted-foreground">{detail}</p>
                              ))}
                            </div>
                            
                            {/* Citations */}
                            <div className="border-t border-border pt-3">
                              <p className="text-xs font-medium text-foreground mb-2">Sources:</p>
                              <div className="space-y-1">
                                {msg.citations?.map((citation, i) => (
                                  <a key={i} href={citation.link} className="flex items-center space-x-2 text-xs text-brand-accent hover:underline">
                                    <Icon name="external-link" size={12} />
                                    <span>{citation.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="border-t border-border pt-4">
                  <div className="flex space-x-2">
                    <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                      <p className="text-sm text-muted-foreground">Ask your UAE legal question...</p>
                    </div>
                    <Button size="sm" disabled>
                      <Icon name="send" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Benefits */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-brand-primary mb-4">
                Instant Legal Guidance for Everyone
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Get preliminary legal advice on employment issues, business questions, family law, 
                tenancy disputes, and more. Our AI analyzes UAE law to provide accurate, 
                cited responses in seconds.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: "shield-check",
                  title: "Verified Legal Sources",
                  description: "Every answer includes citations to specific UAE laws and regulations"
                },
                {
                  icon: "clock",
                  title: "Get Answers in Seconds",
                  description: "No more hours of research - instant responses to your legal questions"
                },
                {
                  icon: "users",
                  title: "For Everyone",
                  description: "Designed for individuals, businesses, and legal professionals alike"
                }
              ].map((benefit, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-brand-warm/20 flex items-center justify-center flex-shrink-0">
                    <Icon name={benefit.icon} size={20} className="text-brand-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-primary mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button variant="premium" size="lg" className="w-full group">
                Start Your Free Queries
                <Icon name="arrow-right" size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}