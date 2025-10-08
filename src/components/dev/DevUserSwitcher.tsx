import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ChevronDownIcon, ChevronUpIcon, PersonIcon, ReloadIcon } from "@radix-ui/react-icons"

// Only render in development
if (!import.meta.env.DEV) {
  throw new Error("DevUserSwitcher should only be imported in development!")
}

interface TestUser {
  name: string
  email: string
  role: 'super_admin' | 'company_admin' | 'company_manager' | 'company_staff' | 'individual'
  company: string | null
}

const TEST_USERS: TestUser[] = [
  {
    name: 'Jawad (Super Admin)',
    email: 'janoon@gmail.com',
    role: 'super_admin',
    company: 'Acme Legal Corp'
  },
  {
    name: 'NX (Super Admin)',
    email: 'nxblochain@gmail.com',
    role: 'super_admin',
    company: null
  },
  {
    name: 'Jawad (Company Admin)',
    email: 'janoondxb@gmail.com',
    role: 'company_admin',
    company: 'Acme Legal Corp'
  },
  {
    name: 'Test User',
    email: 'nxgaymz@gmail.com',
    role: 'individual',
    company: null
  },
  {
    name: 'Raffay (Individual)',
    email: 'raffay.ansari@bigimmersive.com',
    role: 'individual',
    company: null
  }
]

const ROLE_COLORS = {
  super_admin: 'bg-red-500 hover:bg-red-600',
  company_admin: 'bg-blue-500 hover:bg-blue-600',
  company_manager: 'bg-purple-500 hover:bg-purple-600',
  company_staff: 'bg-green-500 hover:bg-green-600',
  individual: 'bg-gray-500 hover:bg-gray-600'
}

const ROLE_LABELS = {
  super_admin: '🔴 Super Admin',
  company_admin: '🔵 Company Admin',
  company_manager: '🟣 Manager',
  company_staff: '🟢 Staff',
  individual: '⚪ Individual'
}

export const DevUserSwitcher = () => {
  const { user, profile, signIn, signOut } = useAuth()
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [password, setPassword] = useState('')

  // Load expanded state from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('devSwitcherExpanded')
    if (saved) setIsExpanded(saved === 'true')
  }, [])

  // Save expanded state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('devSwitcherExpanded', String(isExpanded))
  }, [isExpanded])

  // Keyboard shortcut: Ctrl+Shift+U
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'U') {
        e.preventDefault()
        setIsExpanded(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSwitchUser = async (testUser: TestUser) => {
    if (isSwitching || !password) {
      if (!password) {
        toast({
          title: "Password required",
          description: "Please enter the test user password first",
          variant: "destructive"
        })
      }
      return
    }
    
    setIsSwitching(true)
    toast({
      title: "Switching user...",
      description: `Signing in as ${testUser.name}`,
    })

    try {
      // Sign out current user
      await signOut()
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Sign in as new user
      const { error } = await signIn(testUser.email, password)
      
      if (error) {
        toast({
          title: "Switch failed",
          description: error.message,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Switched successfully",
          description: `Now signed in as ${testUser.name}`,
        })
        setPassword('') // Clear password after successful switch
      }
    } catch (error) {
      toast({
        title: "Switch failed",
        description: "An error occurred while switching users",
        variant: "destructive"
      })
    } finally {
      setIsSwitching(false)
    }
  }

  const currentRole = profile?.user_role || 'individual'
  const currentUserEmail = user?.email || 'Not signed in'

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          className={`${ROLE_COLORS[currentRole as keyof typeof ROLE_COLORS]} text-white shadow-xl hover:shadow-2xl transition-all`}
          size="lg"
        >
          <PersonIcon className="mr-2 h-5 w-5" />
          <span className="font-semibold">{ROLE_LABELS[currentRole as keyof typeof ROLE_LABELS]}</span>
          <ChevronUpIcon className="ml-2 h-5 w-5" />
        </Button>
      ) : (
        <Card className="w-96 shadow-2xl border-4 border-orange-500 bg-background">
          <CardHeader className="bg-orange-100 dark:bg-orange-950/50 pb-4 border-b border-orange-200 dark:border-orange-900">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PersonIcon className="h-5 w-5" />
                <span className="font-bold text-orange-600 dark:text-orange-400">DEV USER SWITCHER</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0 hover:bg-orange-200 dark:hover:bg-orange-900"
              >
                <ChevronDownIcon className="h-5 w-5" />
              </Button>
            </CardTitle>
            <div className="text-sm mt-3 space-y-2">
              <div>
                <div className="font-semibold text-xs text-muted-foreground mb-1">Current User:</div>
                <div className="text-foreground truncate font-medium">{currentUserEmail}</div>
                <Badge variant="outline" className="mt-2">
                  {ROLE_LABELS[currentRole as keyof typeof ROLE_LABELS]}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4 bg-background">
            <div className="space-y-2">
              <Label htmlFor="dev-password" className="text-sm font-semibold">
                Test User Password
              </Label>
              <Input
                id="dev-password"
                type="password"
                placeholder="Enter password for test users"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-2"
              />
              <p className="text-xs text-muted-foreground">
                💡 Use the same password for all test accounts
              </p>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <div className="text-sm font-semibold text-muted-foreground mb-2">
                Switch to:
              </div>
              {TEST_USERS.map((testUser) => (
                <Button
                  key={testUser.email}
                  onClick={() => handleSwitchUser(testUser)}
                  disabled={isSwitching || user?.email === testUser.email || !password}
                  className={`w-full justify-start text-left ${ROLE_COLORS[testUser.role]} text-white disabled:opacity-50 disabled:cursor-not-allowed h-auto py-3`}
                  size="sm"
                >
                  {isSwitching && user?.email === testUser.email ? (
                    <ReloadIcon className="mr-3 h-4 w-4 animate-spin flex-shrink-0" />
                  ) : (
                    <span className="mr-3 text-xl flex-shrink-0">{ROLE_LABELS[testUser.role].split(' ')[0]}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{testUser.name}</div>
                    <div className="text-xs opacity-90 truncate">{testUser.email}</div>
                    {testUser.company && (
                      <div className="text-xs opacity-75 truncate mt-0.5">{testUser.company}</div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="text-xs text-muted-foreground pt-2 border-t bg-muted/30 p-2 rounded">
              💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-background border rounded text-foreground font-mono">Ctrl+Shift+U</kbd> to toggle
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
