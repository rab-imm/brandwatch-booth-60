import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string, signupType?: string, companyName?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      console.log('[fetchProfile] Fetching profile for user:', userId)
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[fetchProfile] Error fetching profile:', profileError)
        return
      }
      
      // Fetch roles from user_roles table (PRIMARY SOURCE OF TRUTH)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
      
      if (rolesError) {
        console.error('[fetchProfile] Error fetching roles:', rolesError)
      }
      
      console.log('[fetchProfile] Roles fetched:', rolesData)
      
      // Combine data - add roles array to profile
      const enrichedProfile = {
        ...profileData,
        roles: rolesData?.map(r => r.role) || [],
        // primary_role is the first role or fallback to user_role for backward compatibility
        primary_role: rolesData?.[0]?.role || profileData?.user_role
      }
      
      setProfile(enrichedProfile)
      console.log('[fetchProfile] Profile set successfully with roles:', enrichedProfile)
    } catch (error) {
      console.error('[fetchProfile] Exception caught:', error)
    }
  }

  const refetchProfile = async () => {
    if (user) {
      // Force JWT refresh when profile changes (e.g., role updates)
      const { data: { session: newSession } } = await supabase.auth.refreshSession()
      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
      }
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Defer profile fetch to avoid potential deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id)
          }, 0)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id)
        }, 0)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string, signupType?: string, companyName?: string) => {
    const redirectUrl = `${window.location.origin}/`
    
    const signupData: any = {
      full_name: fullName || email,
      signup_type: signupType || 'individual'
    }
    
    if (signupType === 'company' && companyName) {
      signupData.company_name = companyName
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: signupData
      }
    })
    
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}