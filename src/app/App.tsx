import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Toaster } from './components/ui/sonner';
import { LoginScreen } from './components/LoginScreen';
import { AudienceDashboard } from './components/AudienceDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PublicActivityFeed } from './components/PublicActivityFeed';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowLoginPrompt(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleLoginPrompt = () => {
    setShowLoginPrompt(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if prompted
  if (showLoginPrompt) {
    return (
      <>
        <LoginScreen onLoginSuccess={() => setShowLoginPrompt(false)} />
        <Toaster />
      </>
    );
  }

  // If user is authenticated
  if (user) {
    // Check if admin (based on email domain or metadata)
    const isAdmin = user.email === 'EcellBVDU@ecell.com' || user.user_metadata?.role === 'admin';
    
    if (isAdmin) {
      return (
        <>
          <AdminDashboard user={user} onLogout={handleLogout} />
          <Toaster />
        </>
      );
    }

    // Regular user - show audience dashboard
    return (
      <>
        <AudienceDashboard user={user} onLogout={handleLogout} />
        <Toaster />
      </>
    );
  }

  // Not authenticated - show public activity feed
  return (
    <>
      <PublicActivityFeed onLoginPrompt={handleLoginPrompt} />
      <Toaster />
    </>
  );
}