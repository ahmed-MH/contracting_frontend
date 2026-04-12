import { Sun, Moon, FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';

interface NavbarProps {
    leftSlot?: React.ReactNode;
    rightSlot?: React.ReactNode;
}

export default function Navbar({ leftSlot, rightSlot }: NavbarProps) {
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation('common');

    return (
        <header className="
            h-14 shrink-0
            bg-brand-light dark:bg-brand-navy
            border-b border-brand-slate/20
            px-6
            flex items-center justify-between
            transition-colors duration-300
        ">
            <div className="flex items-center gap-4">
                <Logo />
                {leftSlot && (
                    <>
                        <div className="w-px h-6 bg-brand-slate/30" />
                        {leftSlot}
                    </>
                )}
            </div>

            <div className="flex items-center gap-3">
                {rightSlot}

                {rightSlot && <div className="w-px h-6 bg-brand-slate/30" />}

                <button
                    onClick={toggleTheme}
                    title={isDark
                        ? t('components.navbar.switchToLightMode', { defaultValue: 'Switch to light mode' })
                        : t('components.navbar.switchToDarkMode', { defaultValue: 'Switch to dark mode' })}
                    className="
                        p-2 rounded-xl
                        text-brand-slate hover:text-brand-navy dark:hover:text-brand-light
                        hover:bg-brand-slate/10 dark:hover:bg-brand-slate/20
                        transition-all duration-300 cursor-pointer
                    "
                    aria-label={t('actions.toggleTheme', { defaultValue: 'Toggle theme' })}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <Button
                    variant="primary"
                    className="gap-2 text-sm"
                    onClick={() => navigate('/contracts')}
                >
                    <FilePlus size={16} />
                    {t('actions.newContract', { defaultValue: 'New contract' })}
                </Button>
            </div>
        </header>
    );
}
