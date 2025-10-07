import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [signupType, setSignupType] = useState<'individual' | 'company'>('individual')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showCodeVerification, setShowCodeVerification] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  
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
        const { error } = await signUp(email, password, fullName, signupType, companyName)
        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Account Created!",
            description: signupType === 'company' 
              ? "Company account created! Please check your email to verify your account."
              : "Please check your email to verify your account."
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

  const handleSendResetCode = async () => {
    if (!resetEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      })
      return
    }

    setResetLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset-code', {
        body: { email: resetEmail }
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Code Sent",
          description: "Check your email for the 6-digit reset code."
        })
        setShowForgotPassword(false)
        setShowCodeVerification(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setResetLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code sent to your email.",
        variant: "destructive"
      })
      return
    }

    setResetLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-reset-code-and-update-password',
        {
          body: { email: resetEmail, code: resetCode }
        }
      )

      if (error || data?.error) {
        toast({
          title: "Invalid Code",
          description: data?.error || error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Code Verified",
          description: "Enter your new password."
        })
        setShowCodeVerification(false)
        setShowNewPassword(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setResetLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match.",
        variant: "destructive"
      })
      return
    }

    setResetLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-reset-code-and-update-password?action=reset',
        {
          body: { email: resetEmail, code: resetCode, newPassword }
        }
      )

      if (error || data?.error) {
        toast({
          title: "Error",
          description: data?.error || error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Password Reset Successful",
          description: "You can now log in with your new password."
        })
        setShowNewPassword(false)
        setResetEmail('')
        setResetCode('')
        setNewPassword('')
        setConfirmPassword('')
        setIsLogin(true)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setResetLoading(false)
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
              <>
                <div className="space-y-4">
                  <Label>Account Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={signupType === 'individual' ? 'premium' : 'outline'}
                      onClick={() => setSignupType('individual')}
                      className="h-auto p-4 text-left"
                    >
                      <div>
                        <div className="font-medium">Individual</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Personal legal research
                        </div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={signupType === 'company' ? 'premium' : 'outline'}
                      onClick={() => setSignupType('company')}
                      className="h-auto p-4 text-left"
                    >
                      <div>
                        <div className="font-medium">Company</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Team collaboration
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

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

                {signupType === 'company' && (
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required={signupType === 'company'}
                      className="mt-1"
                      placeholder="Enter your company name"
                    />
                  </div>
                )}
              </>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email)
                      setShowForgotPassword(true)
                    }}
                    className="text-xs text-brand-accent hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
                <Icon name="loader" size={16} className="animate-spin mr-2" />
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

        {/* Step 1: Enter Email */}
        <AlertDialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Password</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="resetEmail">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-1"
              />
            </div>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button
                variant="premium"
                onClick={handleSendResetCode}
                disabled={resetLoading}
              >
                {resetLoading && <Icon name="loader" size={16} className="animate-spin mr-2" />}
                Send Code
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Step 2: Verify Code */}
        <AlertDialog open={showCodeVerification} onOpenChange={setShowCodeVerification}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Verification Code</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the 6-digit code sent to {resetEmail}. The code expires in 3 hours.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="resetCode">Verification Code</Label>
              <Input
                id="resetCode"
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="mt-1 text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCodeVerification(false)
                  setResetCode('')
                }}
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button
                variant="premium"
                onClick={handleVerifyCode}
                disabled={resetLoading}
              >
                {resetLoading && <Icon name="loader" size={16} className="animate-spin mr-2" />}
                Verify Code
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Step 3: New Password */}
        <AlertDialog open={showNewPassword} onOpenChange={setShowNewPassword}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Password</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your new password. It must be at least 6 characters long.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1"
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="mt-1"
                  minLength={6}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewPassword(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button
                variant="premium"
                onClick={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading && <Icon name="loader-2" size={16} className="animate-spin mr-2" />}
                Reset Password
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}