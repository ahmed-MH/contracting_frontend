import { clsx } from 'clsx';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { I18N_STORAGE_KEY } from '../../lib/i18n';

type LanguageCode = 'fr' | 'en';

const languageOptions: Array<{ code: LanguageCode; label: string }> = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
];

const normalizeLanguage = (language: string | undefined): LanguageCode => {
    if (language?.toLowerCase().startsWith('en')) {
        return 'en';
    }

    return 'fr';
};

interface LanguageSwitcherProps {
    compact?: boolean;
    className?: string;
}

export function LanguageSwitcher({ compact = false, className }: LanguageSwitcherProps) {
    const { i18n } = useTranslation();
    const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

    const handleLanguageChange = (nextLanguage: LanguageCode) => {
        if (nextLanguage === currentLanguage) {
            return;
        }

        localStorage.setItem(I18N_STORAGE_KEY, nextLanguage);
        void i18n.changeLanguage(nextLanguage);
    };

    return (
        <div
            className={clsx(
                'inline-flex items-center gap-1.5 rounded-2xl border border-brand-light/60 bg-brand-light/72 px-2 py-1 shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/5',
                compact && 'py-0.5',
                className,
            )}
        >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-mint/12 text-brand-mint">
                <Languages size={compact ? 14 : 15} />
            </span>

            <div className="inline-flex items-center rounded-xl bg-brand-light/80 p-0.5 dark:bg-brand-navy/80">
                {languageOptions.map((option) => (
                    <button
                        key={option.code}
                        type="button"
                        onClick={() => handleLanguageChange(option.code)}
                        className={clsx(
                            'rounded-xl px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors',
                            currentLanguage === option.code
                                ? 'bg-brand-mint text-brand-light shadow-md'
                                : 'text-brand-slate hover:text-brand-navy dark:text-brand-light/75 dark:hover:text-brand-light',
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
