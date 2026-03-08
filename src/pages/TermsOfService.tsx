import { motion } from 'framer-motion';
import { ChevronLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-12 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-display font-bold">Terms of Service</h1>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="space-y-5">

          <p className="text-muted-foreground text-xs">Last updated: March 8, 2026</p>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground m-0">
              By accessing or using FitCoach ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">2. Description of Service</h2>
            <p className="text-sm text-muted-foreground m-0">
              FitCoach is a personal training companion app that allows personal trainers to manage their clients' workout programs, nutrition plans, and track progress. The App provides tools for workout logging, meal tracking, progress monitoring, and coach-client communication.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">3. User Accounts</h2>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You must be at least 16 years of age to use this App</li>
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">4. Acceptable Use</h2>
            <p className="text-sm text-muted-foreground m-0">You agree not to:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 m-0">
              <li>Use the App for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the App</li>
              <li>Interfere with or disrupt the App's functionality</li>
              <li>Upload malicious content or spam</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">5. Health Disclaimer</h2>
            <p className="text-sm text-muted-foreground m-0">
              The App provides fitness and nutrition tracking tools. It is <strong>not a substitute for professional medical advice</strong>. Always consult a qualified healthcare professional before starting any exercise or nutrition program. The App and its operators are not liable for any injuries, health issues, or adverse effects resulting from following workout plans or nutrition guidance provided through the App.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">6. Intellectual Property</h2>
            <p className="text-sm text-muted-foreground m-0">
              All content, features, and functionality of the App are owned by the App operator. Workout plans and recipes created by coaches remain their intellectual property. You may not reproduce, distribute, or create derivative works from any content without permission.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">7. Data & Privacy</h2>
            <p className="text-sm text-muted-foreground m-0">
              Your use of the App is also governed by our Privacy Policy. By using the App, you consent to the collection and use of information as described in the Privacy Policy. Your fitness data is shared only with your assigned coach.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">8. Account Termination</h2>
            <p className="text-sm text-muted-foreground m-0">
              You may delete your account at any time through the Privacy & Security settings. We reserve the right to suspend or terminate accounts that violate these terms. Upon deletion, all your personal data will be permanently removed.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">9. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground m-0">
              The App is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the App. Our total liability shall not exceed the amount you have paid for the App, if any.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">10. Changes to Terms</h2>
            <p className="text-sm text-muted-foreground m-0">
              We may update these terms from time to time. Continued use of the App after changes constitutes acceptance of the new terms. We will notify you of significant changes through the App.
            </p>
          </section>

          <section className="p-4 rounded-2xl bg-card border border-border space-y-2">
            <h2 className="text-base font-semibold m-0">11. Contact</h2>
            <p className="text-sm text-muted-foreground m-0">
              If you have questions about these Terms of Service, please contact us through the App's support channels.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
