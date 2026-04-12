import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
    ChevronsUpDown,
    Hotel,
    LogOut,
    Moon,
    Plus,
    Sun,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/ui/Logo';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useTheme } from '../hooks/useTheme';
import { useHotel } from '../features/hotel/context/HotelContext';
import { useAuth } from '../features/auth/context/AuthContext';

interface BrandLockupProps {
    eyebrow: string;
    title: string;
    subtitle?: string;
    compact?: boolean;
}

interface HeaderActionsProps {
    roleLabel: string;
    primaryAction?: {
        label: string;
        to: string;
        icon?: LucideIcon;
    };
    compact?: boolean;
    showHotel?: boolean;
}

export function BrandLockup({ eyebrow, title, subtitle, compact = false }: BrandLockupProps) {
    return (
        <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-white/65 bg-white/70 p-2.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <Logo className={compact ? 'scale-90' : ''} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate/85">
                    {eyebrow}
                </p>
                <h1 className={clsx(
                    'truncate font-semibold tracking-tight text-brand-navy dark:text-white',
                    compact ? 'text-base' : 'text-xl md:text-2xl',
                )}>
                    {title}
                </h1>
                {subtitle && !compact && (
                    <p className="mt-1 max-w-2xl text-sm text-brand-slate dark:text-brand-light/80">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}

export function HotelSelector({ compact = false, className }: { compact?: boolean; className?: string }) {
    const { t } = useTranslation(['auth', 'common']);
    const { currentHotel, availableHotels, isLoading, switchHotel } = useHotel();

    if (isLoading) {
        return <div className={clsx('h-11 w-52 animate-pulse rounded-2xl bg-white/50 dark:bg-white/5', className)} />;
    }

    if (availableHotels.length === 0) {
        return null;
    }

    if (availableHotels.length === 1) {
        return (
            <div className={clsx(
                'inline-flex min-w-0 items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5',
                className,
            )}>
                <div className="rounded-xl bg-brand-mint/12 p-2 text-brand-mint">
                    <Hotel size={16} />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-navy dark:text-white">{currentHotel?.name ?? t('common:entities.hotel', { defaultValue: 'Hotel' })}</p>
                    {currentHotel?.reference && (
                        <p className="truncate text-[11px] uppercase tracking-[0.16em] text-brand-slate">
                            {currentHotel.reference}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={clsx('relative min-w-0', className)}>
            <Hotel size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-mint" />
            <select
                value={currentHotel?.id ?? ''}
                onChange={(event) => switchHotel(Number(event.target.value))}
                className={clsx(
                    'w-full appearance-none rounded-2xl border border-white/60 bg-white/72 pl-10 pr-10 text-sm font-medium text-brand-navy shadow-sm outline-none backdrop-blur-xl transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-white/10 dark:bg-white/5 dark:text-white',
                    compact ? 'h-10 min-w-[210px]' : 'h-11 min-w-[240px]',
                )}
            >
                {availableHotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                        {hotel.reference ? `[${hotel.reference}] ` : ''}{hotel.name}
                    </option>
                ))}
            </select>
            <ChevronsUpDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-slate" />
        </div>
    );
}

export function HeaderActions({
    roleLabel,
    primaryAction,
    compact = false,
    showHotel = true,
}: HeaderActionsProps) {
    const { t } = useTranslation(['auth', 'common']);
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    const ActionIcon = primaryAction?.icon ?? Plus;

    return (
        <div className={clsx(
            'flex items-center gap-2 md:gap-3',
            compact && 'gap-2',
        )}>
            {showHotel && <HotelSelector compact={compact} className="hidden lg:block" />}
            <LanguageSwitcher compact={compact} />

            {primaryAction && (
                <button
                    type="button"
                    onClick={() => navigate(primaryAction.to)}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint/90"
                >
                    <ActionIcon size={16} />
                    <span className="hidden xl:inline">{primaryAction.label}</span>
                </button>
            )}

            <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-brand-slate shadow-sm backdrop-blur-xl transition hover:text-brand-navy dark:border-white/10 dark:bg-white/5 dark:text-brand-light/80 dark:hover:text-white"
                aria-label={t('common:actions.toggleTheme', { defaultValue: 'Toggle theme' })}
            >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-white/60 bg-white/72 px-3 py-2 shadow-sm backdrop-blur-xl md:flex dark:border-white/10 dark:bg-white/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-mint/14 text-sm font-bold text-brand-mint">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-navy dark:text-white">
                        {user?.firstName} {user?.lastName}
                    </p>
                    <p className="truncate text-[11px] uppercase tracking-[0.16em] text-brand-slate">
                        {roleLabel}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        logout();
                        navigate('/login', { replace: true });
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-brand-slate transition hover:bg-brand-mint/10 hover:text-brand-mint dark:hover:bg-brand-mint/15"
                    aria-label={t('common:actions.logOut', { defaultValue: 'Log out' })}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
}
