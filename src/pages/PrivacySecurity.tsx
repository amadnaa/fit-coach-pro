import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Eye, Lock, Database, Smartphone, Download, Trash2, LogOut } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}

function Section({ title, icon: Icon, children, delay = 0 }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 rounded-2xl bg-card border border-border space-y-3"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function PrivacySecurity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const results: Record<string, unknown> = {};
      const { data: d1 } = await supabase.from('profiles').select('*').eq('user_id', user.id);
      results.profiles = d1 || [];
      const { data: d2 } = await supabase.from('bodyweight_logs').select('*').eq('user_id', user.id);
      results.bodyweight_logs = d2 || [];
      const { data: d3 } = await supabase.from('workout_logs').select('*').eq('user_id', user.id);
      results.workout_logs = d3 || [];
      const { data: d4 } = await supabase.from('food_logs').select('*').eq('user_id', user.id);
      results.food_logs = d4 || [];
      const { data: d5 } = await supabase.from('step_logs').select('*').eq('user_id', user.id);
      results.step_logs = d5 || [];
      const { data: d6 } = await supabase.from('weekly_check_ins').select('*').eq('user_id', user.id);
      results.weekly_check_ins = d6 || [];
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('privacy.exportSuccess'));
    } catch {
      toast.error(t('errors.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('errors.signInAgain'));
        return;
      }

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast.success(t('privacy.deletedToast'));
      navigate('/login');
    } catch {
      toast.error(t('errors.deletionFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSignOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) { toast.error(error.message); return; }
    toast.success(t('privacy.signedOutAll'));
    navigate('/login');
  };

  const perms = [
    { key: 'camera', label: t('privacy.camera'), desc: t('privacy.cameraDesc') },
    { key: 'location', label: t('privacy.location'), desc: t('privacy.locationDesc') },
    { key: 'contacts', label: t('privacy.contacts'), desc: t('privacy.contactsDesc') },
  ];

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-5 pb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-display font-bold">{t('privacy.title')}</h1>
        </motion.div>

        <Section title={t('privacy.permMgmt')} icon={Smartphone} delay={0.05}>
          <p className="text-xs text-muted-foreground">{t('privacy.permDesc')}</p>
          {perms.map(perm => (
            <div key={perm.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{perm.label}</p>
                <p className="text-xs text-muted-foreground">{perm.desc}</p>
              </div>
              <Switch
                onCheckedChange={() => toast.info(t('privacy.openSettings', { p: perm.label.toLowerCase() }))}
              />
            </div>
          ))}
        </Section>

        <Section title={t('privacy.dataSafety')} icon={Eye} delay={0.1}>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <p className="font-medium text-foreground text-sm">{t('privacy.dataCollected')}</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{t('privacyPolicyPage.s1a').replace(/<[^>]+>/g, '')}</li>
                <li>{t('privacyPolicyPage.s1b').replace(/<[^>]+>/g, '')}</li>
                <li>{t('privacyPolicyPage.s1c').replace(/<[^>]+>/g, '')}</li>
                <li>{t('privacyPolicyPage.s1d').replace(/<[^>]+>/g, '')}</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <p className="font-medium text-foreground text-sm">{t('privacy.processing')}</p>
              <p>{t('privacy.dataSummaryDesc')}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <p className="font-medium text-foreground text-sm">{t('privacy.sharing')}</p>
              <p>{t('privacyPolicyPage.s3a').replace(/<[^>]+>/g, '')}</p>
            </div>
          </div>
        </Section>

        <Section title={t('privacy.accountSecurity')} icon={Lock} delay={0.15}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t('privacy.twoFA')}</p>
                <p className="text-xs text-muted-foreground">{t('privacy.twoFADesc')}</p>
              </div>
              <Switch onCheckedChange={(checked) => {
                toast.info(checked ? t('privacy.twoFAEnabled') : t('privacy.twoFADisabled'));
              }} />
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-medium mb-1">{t('privacy.activeSessions')}</p>
              <p className="text-xs text-muted-foreground mb-2">{t('privacy.currentDevice')}</p>
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={handleSignOutAll}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                {t('privacy.signOutAll')}
              </Button>
            </div>
          </div>
        </Section>

        <Section title={t('privacy.yourData')} icon={Database} delay={0.2}>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t('privacy.dataSummary')}
              </p>
              <p className="text-xs text-muted-foreground">{t('privacy.dataSummaryDesc')}</p>
            </div>

            <Button variant="outline" className="w-full rounded-xl" onClick={handleExportData} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? t('privacy.exporting') : t('privacy.exportData')}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('privacy.deleteAccount')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('privacy.deleteAccountTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('privacy.deleteAccountDesc')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? t('privacy.deleting') : t('privacy.yesDelete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Section>
      </div>
    </MobileLayout>
  );
}
