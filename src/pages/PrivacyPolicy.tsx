import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

export default function PrivacyPolicy() {
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
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-display font-bold">{t('privacyPolicyPage.title')}</h1>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="prose prose-sm dark:prose-invert max-w-none space-y-5">

          <p className="text-muted-foreground text-xs">{t('privacyPolicyPage.lastUpdated')}</p>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('privacyPolicyPage.s1Title')}</h2>
            <p className="text-sm text-muted-foreground m-0">{t('privacyPolicyPage.s1Intro')}</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              {(['s1a','s1b','s1c','s1d'] as const).map(k => (
                <li key={k}><Trans i18nKey={`privacyPolicyPage.${k}`} components={{ strong: <strong /> }} /></li>
              ))}
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('privacyPolicyPage.s2Title')}</h2>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              {(['s2a','s2b','s2c','s2d','s2e'] as const).map(k => (<li key={k}>{t(`privacyPolicyPage.${k}`)}</li>))}
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('privacyPolicyPage.s3Title')}</h2>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              {(['s3a','s3b','s3c','s3d'] as const).map(k => (
                <li key={k}><Trans i18nKey={`privacyPolicyPage.${k}`} components={{ strong: <strong /> }} /></li>
              ))}
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('privacyPolicyPage.s4Title')}</h2>
            <p className="text-sm text-muted-foreground m-0">{t('privacyPolicyPage.s4Body')}</p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('privacyPolicyPage.s5Title')}</h2>
            <p className="text-sm text-muted-foreground m-0">{t('privacyPolicyPage.s5Intro')}</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              {(['s5a','s5b','s5c','s5d'] as const).map(k => (
                <li key={k}><Trans i18nKey={`privacyPolicyPage.${k}`} components={{ strong: <strong /> }} /></li>
              ))}
            </ul>
          </section>

          {(['s6','s7','s8','s9'] as const).map(s => (
            <section key={s} className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <h2 className="text-base font-semibold m-0">{t(`privacyPolicyPage.${s}Title`)}</h2>
              <p className="text-sm text-muted-foreground m-0">{t(`privacyPolicyPage.${s}Body`)}</p>
            </section>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
