// app/context/AuthContext.tsx - VERSION CORRIGÉE
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { supabase } from '../lib/supabase';
// Notification setup removed

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInAnonymously: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupère la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // NOUVEAU : Enregistrer pour les notifications si connecté

    });

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // NOUVEAU : Enregistrer pour les notifications si connecté

    });

    return () => subscription.unsubscribe();
  }, []);



  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // IMPORTANT : Désactiver la confirmation email pour le développement
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Ne pas exiger de confirmation d'email
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error('Erreur signUp:', error);
        return { error };
      }

      // Si Supabase demande confirmation, on informe l'utilisateur
      if (data.user && !data.session) {
        return {
          error: {
            message: 'Veuillez vérifier votre email pour confirmer votre inscription.',
          },
        };
      }

      return { error: null };
    } catch (err: any) {
      console.error('Exception signUp:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erreur signIn:', error);

        // Gérer les erreurs spécifiques
        if (error.message.includes('Email not confirmed')) {
          return {
            error: {
              message: 'Veuillez confirmer votre email avant de vous connecter.',
            },
          };
        }

        if (error.message.includes('Invalid login credentials')) {
          return {
            error: {
              message: 'Email ou mot de passe incorrect.',
            },
          };
        }

        return { error };
      }

      return { error: null };
    } catch (err: any) {
      console.error('Exception signIn:', err);
      return { error: err };
    }
  };

  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('Erreur signInAnonymously:', error);
        return { error };
      }

      return { error: null };
    } catch (err: any) {
      console.error('Exception signInAnonymously:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Erreur signOut:', error);
      }

      // Réinitialiser l'état même en cas d'erreur
      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('Exception signOut:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInAnonymously,
        signOut,
      }}
    >
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;