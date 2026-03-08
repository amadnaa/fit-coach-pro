import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Also check hash for recovery type
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success('Password updated successfully');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-4"
        >
          <KeyRound className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold">Invalid Link</h1>
          <p className="text-muted-foreground text-sm">
            This password reset link is invalid or has expired.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold">
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center space-y-4"
        >
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-display font-bold">Password Updated</h1>
          <p className="text-muted-foreground text-sm">Redirecting to login…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-2">
            <KeyRound className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Set New Password</h1>
          <p className="text-muted-foreground text-sm">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-secondary border-0 px-4"
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl bg-secondary border-0 px-4"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base shadow-lg"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Password'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
