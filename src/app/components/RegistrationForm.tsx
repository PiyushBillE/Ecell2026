import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface RegistrationFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function RegistrationForm({ onBack, onSuccess }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    course: '',
    prn: '',
    rollNumber: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the server endpoint to create user with email confirmation disabled
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-19c6936e/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.fullName,
            metadata: {
              full_name: formData.fullName,
              course: formData.course,
              prn: formData.prn,
              roll_number: formData.rollNumber,
            }
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || 'Registration failed');
        return;
      }

      // Auto sign in after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error('Sign in error after registration:', signInError);
        toast.success('Registration successful! Please sign in.');
        onSuccess();
        return;
      }

      toast.success('Registration successful!');
      onSuccess();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-md mx-auto">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6 text-slate-300 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-white">
            Student Registration
          </CardTitle>
          <CardDescription className="text-slate-300 text-base">
            Fill in your details to participate in events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-200">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="h-12 bg-slate-900/50 border-slate-600 text-white focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="h-12 bg-slate-900/50 border-slate-600 text-white focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course" className="text-slate-200">
                Course
              </Label>
              <Input
                id="course"
                name="course"
                type="text"
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g., B.Tech Computer Science"
                className="h-12 bg-slate-900/50 border-slate-600 text-white focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prn" className="text-slate-200">
                PRN
              </Label>
              <Input
                id="prn"
                name="prn"
                type="text"
                value={formData.prn}
                onChange={handleChange}
                className="h-12 bg-slate-900/50 border-slate-600 text-white focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rollNumber" className="text-slate-200">
                Roll Number
              </Label>
              <Input
                id="rollNumber"
                name="rollNumber"
                type="text"
                value={formData.rollNumber}
                onChange={handleChange}
                className="h-12 bg-slate-900/50 border-slate-600 text-white focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="h-12 bg-slate-900/50 border-slate-600 text-white focus:border-blue-500"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registering...</span>
                </div>
              ) : (
                'Register'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}