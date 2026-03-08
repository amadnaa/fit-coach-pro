import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-12 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-display font-bold">Privacy Policy</h1>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="prose prose-sm dark:prose-invert max-w-none space-y-5">

          <p className="text-muted-foreground text-xs">Last updated: March 8, 2026</p>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground m-0">We collect the following information when you use FitCoach:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              <li><strong>Account Information:</strong> Email address, display name, and profile photo</li>
              <li><strong>Health & Fitness Data:</strong> Workout logs, body weight, nutrition logs, step counts, sleep data, and cardio logs</li>
              <li><strong>Usage Data:</strong> Check-ins, training preferences, and onboarding responses</li>
              <li><strong>Device Data:</strong> Device type and app preferences (theme, notification settings)</li>
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">2. How We Use Your Information</h2>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              <li>Provide and improve the coaching experience</li>
              <li>Share your progress data with your assigned coach</li>
              <li>Send workout and nutrition reminders (with your consent)</li>
              <li>Generate progress reports and analytics</li>
              <li>Maintain and secure your account</li>
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">3. Data Sharing</h2>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              <li>Your fitness data is shared <strong>only with your assigned coach</strong></li>
              <li>We do <strong>not</strong> sell your personal data to third parties</li>
              <li>We do <strong>not</strong> use your data for advertising</li>
              <li>We may use anonymized, aggregated data for service improvement</li>
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">4. Data Storage & Security</h2>
            <p className="text-sm text-muted-foreground m-0">
              Your data is stored securely in encrypted cloud databases with row-level security policies. Access is restricted to your account and your assigned coach. All data transfers use TLS encryption.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">5. Your Rights</h2>
            <p className="text-sm text-muted-foreground m-0">You have the right to:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              <li><strong>Access:</strong> Export all your data at any time from Privacy & Security settings</li>
              <li><strong>Delete:</strong> Permanently delete your account and all associated data</li>
              <li><strong>Correct:</strong> Update your profile information at any time</li>
              <li><strong>Withdraw consent:</strong> Disable notifications or revoke permissions</li>
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">6. Data Retention</h2>
            <p className="text-sm text-muted-foreground m-0">
              We retain your data for as long as your account is active. When you delete your account, all personal data is permanently removed from our systems. Anonymized aggregate data may be retained for analytics.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">7. Children's Privacy</h2>
            <p className="text-sm text-muted-foreground m-0">
              FitCoach is not intended for users under 16 years of age. We do not knowingly collect data from children.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">8. Changes to This Policy</h2>
            <p className="text-sm text-muted-foreground m-0">
              We may update this privacy policy from time to time. We will notify you of any significant changes through the app or via email.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">9. Contact Us</h2>
            <p className="text-sm text-muted-foreground m-0">
              If you have any questions about this privacy policy or your data, please contact us through the app's support channels.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
