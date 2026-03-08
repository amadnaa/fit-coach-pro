import { motion } from 'framer-motion';
import { LogOut, Moon, Sun, User, Shield, Bell } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ProfileView() {
  const { user, role, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <MobileLayout>
      <div className="px-5 pt-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">{user?.user_metadata?.full_name || user?.email}</h1>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
              role === 'coach' ? "bg-coach/10 text-coach" : "bg-primary/10 text-primary"
            )}>
              {role || 'user'}
            </span>
          </div>
        </motion.div>

        <div className="space-y-2">
          {[
            { icon: User, label: 'Edit Profile', action: () => {} },
            { icon: Bell, label: 'Notifications', action: () => {} },
            { icon: darkMode ? Sun : Moon, label: darkMode ? 'Light Mode' : 'Dark Mode', action: toggleDark },
            { icon: Shield, label: 'Privacy & Security', action: () => {} },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left hover:bg-secondary transition-colors"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
            </motion.button>
          ))}
        </div>

        <Button
          onClick={signOut}
          variant="outline"
          className="w-full h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
}
