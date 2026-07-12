import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

/**
 * Forced first-login screen. Clients created by a coach are given a temporary
 * password and must replace it here before they can use the app. The
 * `must_change_password` flag lives in the auth user's metadata and is cleared
 * once the new password is saved.
 */
export default function SetPassword() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("errors.passwordsDontMatch"));
      return;
    }
    if (password.length < 8) {
      toast.error(t("errors.passwordMin8"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });
      if (error) throw error;
      toast.success(t("auth.passwordUpdated"));
      // The auth state change (USER_UPDATED) clears the gate and routing continues.
    } catch (err: any) {
      toast.error(err.message || t("errors.failedUpdatePassword"));
    } finally {
      setLoading(false);
    }
  };

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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-2">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            {t("auth.setPasswordTitle")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("auth.setPasswordSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative space-y-2">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.newPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-secondary border-0 px-4 pr-12"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="space-y-2">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.confirmNewPassword")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-12 rounded-xl bg-secondary border-0 px-4"
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base shadow-lg"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.updatePassword")}
          </Button>
        </form>

        <button
          onClick={() => signOut()}
          className="block w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {t("auth.signIn")}
        </button>
      </motion.div>
    </div>
  );
}
