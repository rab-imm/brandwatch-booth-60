import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { user, signIn, signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been successfully logged in."
          })
          navigate('/')
        }
      } else {
        const { error } = await signUp(email, password, fullName)
        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Account Created!",
            description: "Please check your email to verify your account."
          })
          setIsLogin(true)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-primary font-pact-display">
            UAE Legal AI
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isLogin ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        <Card className="p-8 bg-card border-dashboard-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="mt-1"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your password"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              variant="premium"
              disabled={loading}
            >
              {loading ? (
                <Icon name="loader-2" size={16} className="animate-spin mr-2" />
              ) : null}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-brand-accent hover:underline"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          {!isLogin && (
            <div className="mt-6 p-4 bg-brand-warm/10 rounded-lg border border-brand-warm/20">
              <div className="flex items-start space-x-2">
                <Icon name="gift" size={16} className="text-brand-accent mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-brand-primary">Free Account Includes:</p>
                  <ul className="mt-1 text-muted-foreground space-y-0.5">
                    <li>• 3 free legal queries per month</li>
                    <li>• Full access to UAE law database</li>
                    <li>• Citations and source references</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}