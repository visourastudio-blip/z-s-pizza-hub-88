import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Address } from '@/types';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  cep: string | null;
}

type AppRole = 'admin' | 'employee' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmployee: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (data && !error) {
      setProfile(data);
    }
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (data && !error) {
      setRoles(data.map(r => r.role as AppRole));
    } else {
      setRoles([]);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile and roles fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, message: 'Email ou senha incorretos' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Login realizado com sucesso!' };
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<{ success: boolean; message: string }> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        return { success: false, message: 'Email já cadastrado' };
      }
      return { success: false, message: error.message };
    }

    // Create or update profile with phone
    if (data.user) {
      // Try upsert to handle cases where trigger didn't create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name,
          email,
          phone,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Fetch profile after creation
      await fetchProfile(data.user.id);
    }

    return { success: true, message: 'Cadastro realizado com sucesso!' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const updateAddress = async (address: Address) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        cep: address.cep,
      })
      .eq('id', user.id);

    if (!error) {
      await fetchProfile(user.id);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const isEmployee = roles.includes('employee') || roles.includes('admin');
  const isAdmin = roles.includes('admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isAuthenticated: !!user,
        isLoading,
        isEmployee,
        isAdmin,
        login,
        register,
        logout,
        updateAddress,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
