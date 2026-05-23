import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t('errors.passwordMin6'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('errors.passwordsDontMatch'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success(t('auth.passwordUpdatedToast'));
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      toast.error(err.message || t('errors.failedUpdatePassword'));
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <LanguageSelector variant="floating" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-4"
        >
          <KeyRound className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold">{t('auth.invalidLink')}</h1>
          <p className="text-muted-foreground text-sm">{t('auth.invalidLinkBody')}</p>
          <Button onClick={() => navigate('/login')} className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold">
            {t('auth.backToLogin')}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <LanguageSelector variant="floating" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center space-y-4"
        >
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold">{t('auth.passwordUpdated')}</h1>
          <p className="text-muted-foreground text-sm">{t('auth.redirecting')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <LanguageSelector variant="floating" />
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
          <h1 className="text-2xl font-display font-bold">{t('auth.setNewPassword')}</h1>
          <p className="text-muted-foreground text-sm">{t('auth.setNewPasswordSub')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder={t('auth.newPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-secondary border-0 px-4"
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder={t('auth.confirmNewPassword')}
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
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.updatePassword')}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
