import { Languages, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, STORAGE_KEY } from '@/i18n';

const LABELS: Record<string, string> = { en: 'English', es: 'Español' };

interface Props {
  variant?: 'floating' | 'inline';
  className?: string;
}

export function LanguageSelector({ variant = 'floating', className }: Props) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  };

  const trigger =
    variant === 'floating' ? (
      <button
        aria-label={t('common.selectLanguage')}
        className={cn(
          'fixed top-3 right-3 z-40 w-9 h-9 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-card transition-colors safe-top',
          className
        )}
      >
        <Languages className="h-4 w-4" />
      </button>
    ) : (
      <button
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-secondary transition-colors',
          className
        )}
      >
        <Languages className="h-4 w-4 text-primary" />
        <span>{LABELS[current] || 'English'}</span>
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleChange(lang)}
            className="cursor-pointer flex items-center justify-between gap-6"
          >
            <span>{LABELS[lang]}</span>
            {current === lang && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
