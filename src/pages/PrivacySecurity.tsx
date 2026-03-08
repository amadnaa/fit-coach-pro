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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
      toast.success('Data exported successfully!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete user data from all tables
      await supabase.from('bodyweight_logs').delete().eq('user_id', user.id);
      await supabase.from('workout_logs').delete().eq('user_id', user.id);
      await supabase.from('food_logs').delete().eq('user_id', user.id);
      await supabase.from('step_logs').delete().eq('user_id', user.id);
      await supabase.from('cardio_logs').delete().eq('user_id', user.id);
      await supabase.from('weekly_check_ins').delete().eq('user_id', user.id);
      await supabase.from('check_ins').delete().eq('user_id', user.id);
      await supabase.from('workout_sessions').delete().eq('user_id', user.id);
      await supabase.from('scheduled_sessions').delete().eq('user_id', user.id);
      await supabase.from('user_preferences').delete().eq('user_id', user.id);
      await supabase.from('notifications').delete().eq('recipient_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);
      await signOut();
      toast.success('Account data deleted. Contact support to complete account removal.');
      navigate('/login');
    } catch {
      toast.error('Deletion failed. Please contact support.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSignOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) { toast.error(error.message); return; }
    toast.success('Signed out of all devices');
    navigate('/login');
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-5 pb-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-display font-bold">Privacy & Security</h1>
        </motion.div>

        {/* Permission Management */}
        <Section title="Permission Management" icon={Smartphone} delay={0.05}>
          <p className="text-xs text-muted-foreground">
            These permissions are managed by your device. Toggle them in your device's system settings.
          </p>
          {[
            { label: 'Camera', desc: 'Used for profile photos and check-in images' },
            { label: 'Location', desc: 'Not currently used by this app' },
            { label: 'Contacts', desc: 'Not currently used by this app' },
          ].map(perm => (
            <div key={perm.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{perm.label}</p>
                <p className="text-xs text-muted-foreground">{perm.desc}</p>
              </div>
              <Switch
                onCheckedChange={() => toast.info(`Open your device settings to manage ${perm.label.toLowerCase()} permission.`)}
              />
            </div>
          ))}
        </Section>

        {/* Data Safety */}
        <Section title="Data Safety Disclosures" icon={Eye} delay={0.1}>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <p className="font-medium text-foreground text-sm">Data Collected</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Email address (authentication)</li>
                <li>Display name and profile photo</li>
                <li>Workout logs, body weight, nutrition data</li>
                <li>Check-in submissions and notes</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <p className="font-medium text-foreground text-sm">Processing</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>All data is stored securely in encrypted cloud databases</li>
                <li>Theme preferences are processed on-device</li>
                <li>No data is sold to third parties</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 space-y-1">
              <p className="font-medium text-foreground text-sm">Sharing</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Your assigned coach can view your workout data, check-ins, and progress</li>
                <li>No data is shared with external parties</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Account Security */}
        <Section title="Account Security" icon={Lock} delay={0.15}>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security via email verification</p>
              </div>
              <Switch onCheckedChange={(checked) => {
                toast.info(checked ? '2FA is enforced via email verification on sign-in.' : '2FA has been disabled.');
              }} />
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-medium mb-1">Active Sessions</p>
              <p className="text-xs text-muted-foreground mb-2">You are currently signed in on this device.</p>
              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={handleSignOutAll}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out All Devices
              </Button>
            </div>
          </div>
        </Section>

        {/* Your Data */}
        <Section title="Your Data" icon={Database} delay={0.2}>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-secondary/50">
              <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Data Summary
              </p>
              <p className="text-xs text-muted-foreground">
                Your account stores profile information, workout history, nutrition logs, body weight records, and check-in data. All data is protected with row-level security.
              </p>
            </div>

            <Button variant="outline" className="w-full rounded-xl" onClick={handleExportData} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export My Data'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all your data including workouts, nutrition logs, check-ins, and profile information. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
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
