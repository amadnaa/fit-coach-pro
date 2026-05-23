import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { LanguageSelector } from '@/components/LanguageSelector';

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function MobileLayout({ children, hideNav }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background safe-top">
      <LanguageSelector variant="floating" />
      <main className={hideNav ? '' : 'pb-20'}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
