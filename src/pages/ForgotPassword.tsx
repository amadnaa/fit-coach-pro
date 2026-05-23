import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation, Trans } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || t('errors.failedSendReset'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <LanguageSelector variant="floating" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center space-y-4"
        >
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold">{t('auth.checkEmail')}</h1>
          <p className="text-muted-foreground text-sm">
            <Trans i18nKey="auth.resetSentMessage" values={{ email }} components={[<strong key="0" />]} />
          </p>
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('auth.backToLogin')}
          </Button>
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
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">{t('auth.forgotTitle')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('auth.forgotSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl bg-secondary border-0 px-4"
            autoComplete="email"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base shadow-lg"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.sendResetLink')}
          </Button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {t('auth.backToLogin')}
        </button>
      </motion.div>
    </div>
  );
}
