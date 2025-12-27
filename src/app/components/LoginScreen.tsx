import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { RegistrationForm } from './RegistrationForm';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  returnUrl?: string;
}

export function LoginScreen({ onLoginSuccess, returnUrl }: LoginScreenProps) {
  const [view, setView] = useState<'main' | 'register' | 'student-login'>('main');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('EcellBVDU@ecell.com');
  const [adminPassword, setAdminPassword] = useState('SharkTank2026');
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    toast.info('Google Sign-In will be enabled soon');
    // Placeholder - will be enabled after Google OAuth setup
  };

  const handleStudentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStudentLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: studentEmail,
        password: studentPassword,
      });

      if (error) {
        console.error('Student sign in error:', error);
        setError(error.message || 'Authentication failed. Try again.');
        toast.error(error.message || 'Authentication failed. Try again.');
      } else if (data.session) {
        toast.success('Welcome back!');
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      console.error('Student sign in exception:', err);
      setError('Authentication failed. Try again.');
      toast.error('Authentication failed. Try again.');
    } finally {
      setIsStudentLoading(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    setError('');

    try {
      console.log('Attempting admin sign in...');
      console.log('Supabase URL:', `https://${projectId}.supabase.co`);
      console.log('Email:', adminEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (error) {
        console.error('Admin sign in error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        setError(`${error.message}. Make sure you created the admin account in Supabase with email: ${adminEmail} and enabled "Auto Confirm User"`);
        toast.error(error.message);
      } else if (data.session) {
        console.log('Admin login successful!', data);
        toast.success('Welcome back, Admin!');
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      console.error('Admin sign in exception:', err);
      setError('Authentication failed. Try again.');
      toast.error('Authentication failed. Try again.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  if (view === 'register') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <RegistrationForm
          onBack={() => setView('main')}
          onSuccess={() => {
            setView('main');
            if (onLoginSuccess) onLoginSuccess();
          }}
        />
      </div>
    );
  }

  if (view === 'student-login') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <header className="w-full px-6 py-8 border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">EC</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl text-white">E-Cell BVDU Navi Mumbai</h1>
                <p className="text-slate-300 text-sm md:text-base mt-1">Live Events • Polls • Quizzes</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full px-4 md:px-6 py-12 flex items-center justify-center">
          <div className="max-w-md w-full">
            <Button
              onClick={() => setView('main')}
              variant="ghost"
              className="mb-6 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl text-white">
                  Student Sign In
                </CardTitle>
                <CardDescription className="text-slate-300 text-base">
                  Sign in with your registered account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="student-email" className="text-slate-200 text-base">
                      Email address
                    </Label>
                    <Input
                      id="student-email"
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="h-12 bg-slate-900/50 border-slate-600 text-white text-base focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-password" className="text-slate-200 text-base">
                      Password
                    </Label>
                    <Input
                      id="student-password"
                      type="password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="h-12 bg-slate-900/50 border-slate-600 text-white text-base focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isStudentLoading}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {isStudentLoading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <div className="text-center">
                    <p className="text-slate-400 text-sm">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setView('register')}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Register here
                      </button>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-8 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">EC</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl text-white">E-Cell BVDU Navi Mumbai</h1>
              <p className="text-slate-300 text-sm md:text-base mt-1">Live Events • Polls • Quizzes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 md:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-center">
              {error}
            </div>
          )}

          {/* Login Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Audience Login Card */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl md:text-3xl text-white">
                  Student Login
                </CardTitle>
                <CardDescription className="text-slate-300 text-base md:text-lg">
                  Sign in to participate in live polls and quizzes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled
                  className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 text-lg transition-all duration-200 shadow-lg opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </div>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-2 text-slate-400">Or</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setView('student-login')}
                    variant="outline"
                    className="w-full h-12 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                  >
                    Sign in with Email
                  </Button>

                  <Button
                    onClick={() => setView('register')}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Register as Student
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin Login Card */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl md:text-3xl text-white">
                  Admin / Coordinator Login
                </CardTitle>
                <CardDescription className="text-slate-300 text-base md:text-lg">
                  For event organizers and faculty only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-slate-200 text-base">
                      Email address
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="h-12 bg-slate-900/50 border-slate-600 text-white text-base focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-slate-200 text-base">
                      Password
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="h-12 bg-slate-900/50 border-slate-600 text-white text-base focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isAdminLoading}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {isAdminLoading ? 'Signing in...' : 'Sign In as Admin'}
                  </Button>

                  <div className="pt-4 border-t border-slate-700">
                    <div className="space-y-2 text-sm text-slate-400">
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Restricted access
                      </p>
                      <p className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                        </svg>
                        Authorized accounts only
                      </p>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">
          <p>Powered by Supabase • Secure authentication</p>
        </div>
      </footer>
    </div>
  );
}