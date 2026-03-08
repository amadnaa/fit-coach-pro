import { Home, Dumbbell, BarChart3, UtensilsCrossed, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const coachTabs = [
  { icon: Home, label: 'Clients', path: '/coach' },
  { icon: Dumbbell, label: 'Exercises', path: '/coach/exercises' },
  { icon: UtensilsCrossed, label: 'Recipes', path: '/coach/recipes' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { flags } = useFeatureFlags();

  const clientTabs = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Dumbbell, label: 'Workout', path: '/workout' },
    { icon: BarChart3, label: 'Progress', path: '/progress' },
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
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[60px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
