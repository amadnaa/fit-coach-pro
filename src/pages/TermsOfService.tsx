import { motion } from 'framer-motion';
import { ChevronLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

export default function TermsOfService() {
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
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-display font-bold">{t('tosPage.title')}</h1>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-5">
          <p className="text-muted-foreground text-xs">{t('tosPage.lastUpdated')}</p>

          {(['s1','s2'] as const).map(s => (
            <section key={s} className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <h2 className="text-base font-semibold m-0">{t(`tosPage.${s}Title`)}</h2>
              <p className="text-sm text-muted-foreground m-0">{t(`tosPage.${s}Body`)}</p>
            </section>
          ))}

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('tosPage.s3Title')}</h2>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              {(['s3a','s3b','s3c','s3d'] as const).map(k => (<li key={k}>{t(`tosPage.${k}`)}</li>))}
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('tosPage.s4Title')}</h2>
            <p className="text-sm text-muted-foreground m-0">{t('tosPage.s4Intro')}</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              {(['s4a','s4b','s4c','s4d','s4e'] as const).map(k => (<li key={k}>{t(`tosPage.${k}`)}</li>))}
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">{t('tosPage.s5Title')}</h2>
            <p className="text-sm text-muted-foreground m-0"><Trans i18nKey="tosPage.s5Body" components={{ strong: <strong /> }} /></p>
          </section>

          {(['s6','s7','s8','s9','s10','s11'] as const).map(s => (
            <section key={s} className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <h2 className="text-base font-semibold m-0">{t(`tosPage.${s}Title`)}</h2>
              <p className="text-sm text-muted-foreground m-0">{t(`tosPage.${s}Body`)}</p>
            </section>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
