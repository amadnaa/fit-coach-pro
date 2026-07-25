import { motion } from 'framer-motion';
import { ChevronLeft, LifeBuoy, Mail, FileText, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// TODO before submission: replace with the coach's real support address.
const SUPPORT_EMAIL = 'REPLACE-ME@example.com';

export default function Support() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-12 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-display font-bold">{t('supportPage.title')}</h1>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-4">
          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('supportPage.contactTitle')}</h2>
            <p className="text-sm text-muted-foreground m-0">{t('supportPage.contactBody')}</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-2 text-sm font-medium text-primary"
            >
              <Mail className="h-4 w-4" />
              {SUPPORT_EMAIL}
            </a>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('supportPage.legalTitle')}</h2>
            <button
              onClick={() => navigate('/privacy-policy')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-background border border-border text-left hover:bg-secondary transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('supportPage.privacyPolicy')}</span>
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-background border border-border text-left hover:bg-secondary transition-colors"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('supportPage.terms')}</span>
            </button>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
