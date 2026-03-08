import { Home, Dumbbell, BarChart3, UtensilsCrossed, User, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useNotifications } from '@/hooks/useNotifications';

const coachTabs = [
  { icon: Home, label: 'Clients', path: '/coach' },
  { icon: Dumbbell, label: 'Exercises', path: '/coach/exercises' },
  { icon: Bell, label: 'Alerts', path: '/notifications', showBadge: true },
  { icon: UtensilsCrossed, label: 'Recipes', path: '/coach/recipes' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { flags } = useFeatureFlags();
  const { unreadCount } = useNotifications();

  const clientTabs = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Dumbbell, label: 'Workout', path: '/workout' },
    { icon: Bell, label: 'Alerts', path: '/notifications', showBadge: true },
    { icon: UtensilsCrossed, label: 'Nutrition', path: '/nutrition' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];
  
  const tabs = role === 'coach' ? coachTabs : clientTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-elevated safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || 
            (tab.path !== '/dashboard' && tab.path !== '/coach' && location.pathname.startsWith(tab.path));
          const showBadge = 'showBadge' in tab && tab.showBadge && unreadCount > 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
