import { useEffect, useId, useRef, useState } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import {
    ChevronDown,
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
    compactAccount?: boolean;
    withGroupDividers?: boolean;
    useProfileDropdown?: boolean;
    className?: string;
}

export function BrandLockup({ eyebrow, title, subtitle, compact = false }: BrandLockupProps) {
    return (
        <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-brand-light/65 bg-brand-light/70 p-2.5 shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/5">
                <Logo className={compact ? 'scale-90' : ''} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate/85">
                    {eyebrow}
                </p>
                <h1 className={clsx(
                    'truncate font-semibold tracking-tight text-brand-navy dark:text-brand-light',
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
    const hotelName = currentHotel?.name ?? t('common:entities.hotel', { defaultValue: 'Hotel' });
    const hotelReference = currentHotel?.reference;

    if (isLoading) {
        return <div className={clsx(compact ? 'h-10' : 'h-11', 'w-52 animate-pulse rounded-xl border border-brand-light/50 bg-transparent dark:border-brand-light/10', className)} />;
    }

    if (availableHotels.length === 0) {
        return null;
    }

    if (availableHotels.length === 1) {
        return (
            <div className={clsx(
                compact ? 'h-10' : 'h-11',
                'inline-flex min-w-0 items-center gap-2.5 rounded-xl border border-brand-slate/12 bg-brand-light/72 px-2.5 shadow-sm backdrop-blur-xl transition-colors hover:border-brand-mint/25 hover:bg-brand-light dark:border-brand-light/10 dark:bg-brand-light/5 dark:hover:border-brand-mint/25 dark:hover:bg-brand-light/8',
                className,
            )}
            title={hotelReference ? `${hotelName} - ${hotelReference}` : hotelName}
            >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint ring-1 ring-brand-mint/15">
                    <Hotel size={15} />
                </div>
                <div className="min-w-0 leading-none">
                    <p className="truncate text-[13px] font-semibold text-brand-navy dark:text-brand-light">{hotelName}</p>
                    {hotelReference && (
                        <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/45">
                            {hotelReference}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={clsx(
                compact ? 'h-10' : 'h-11',
                'group relative min-w-0 overflow-hidden rounded-xl border border-brand-slate/12 bg-brand-light/72 shadow-sm backdrop-blur-xl transition-colors hover:border-brand-mint/25 hover:bg-brand-light focus-within:border-brand-mint focus-within:ring-2 focus-within:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:hover:border-brand-mint/25 dark:hover:bg-brand-light/8',
                className,
            )}
            title={hotelReference ? `${hotelName} - ${hotelReference}` : hotelName}
        >
            <div className="pointer-events-none flex h-full min-w-0 items-center gap-2.5 px-2.5 pr-8">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint ring-1 ring-brand-mint/15">
                    <Hotel size={15} />
                </div>
                <div className="min-w-0 leading-none">
                    <p className="truncate text-[13px] font-semibold text-brand-navy dark:text-brand-light">{hotelName}</p>
                    {hotelReference && (
                        <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/45">
                            {hotelReference}
                        </p>
                    )}
                </div>
            </div>
            <select
                aria-label={t('common:actions.selectHotel', { defaultValue: 'Select hotel' })}
                value={currentHotel?.id ?? ''}
                onChange={(event) => switchHotel(Number(event.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
            >
                {availableHotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                        {hotel.reference ? `[${hotel.reference}] ` : ''}{hotel.name}
                    </option>
                ))}
            </select>
            <ChevronsUpDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-slate transition-colors group-hover:text-brand-mint" />
        </div>
    );
}

export function UserProfileDropdown({ roleLabel }: { roleLabel: string }) {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuId = useId();
    const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}` || 'U';

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [isOpen]);

    return (
        <div
            ref={dropdownRef}
            className="group relative"
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    setIsOpen(false);
                }
            }}
        >
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={menuId}
                onClick={() => setIsOpen((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-slate/15 bg-brand-light/75 px-2.5 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-mint/30 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mint/12 text-xs font-bold text-brand-mint">
                    {initials}
                </span>
                <span className="hidden max-w-36 truncate xl:inline">
                    {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown size={14} className="text-brand-slate" />
            </button>

            <div
                id={menuId}
                role="menu"
                className={clsx(
                    'absolute right-0 top-full z-40 w-64 pt-2 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100',
                    isOpen ? 'visible opacity-100' : 'invisible opacity-0',
                )}
            >
                <div className={clsx(
                    'pricify-dropdown-surface translate-y-1 transition group-focus-within:translate-y-0 group-hover:translate-y-0',
                    isOpen && 'translate-y-0',
                )}>
                    <div className="px-3 py-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-mint/12 text-sm font-bold text-brand-mint">
                                {initials}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-brand-navy dark:text-brand-light">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="truncate text-[11px] uppercase tracking-[0.16em] text-brand-slate">
                                    {roleLabel}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-brand-slate/10 pt-2 dark:border-brand-light/10">
                        <div className="flex items-center justify-between rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">
                                {t('actions.language', { defaultValue: 'Language' })}
                            </span>
                            <LanguageSwitcher compact />
                        </div>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={toggleTheme}
                            className="pricify-dropdown-item"
                        >
                            <span>{t('actions.toggleTheme', { defaultValue: 'Toggle theme' })}</span>
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                logout();
                                navigate('/login', { replace: true });
                            }}
                            className="pricify-dropdown-item pricify-dropdown-item-strong"
                        >
                            <span>{t('actions.logOut', { defaultValue: 'Log out' })}</span>
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function HeaderActions({
    roleLabel,
    primaryAction,
    compact = false,
    showHotel = true,
    compactAccount = false,
    withGroupDividers = false,
    useProfileDropdown = false,
    className,
}: HeaderActionsProps) {
    const { t } = useTranslation(['auth', 'common']);
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    const ActionIcon = primaryAction?.icon ?? Plus;

    return (
        <div className={clsx(
            'flex flex-wrap items-center gap-2 md:gap-3',
            compact && 'gap-2',
            className,
        )}>
            {showHotel && (
                <div className="hidden w-[230px] lg:block">
                    <HotelSelector compact={compact} className="w-full" />
                </div>
            )}
            {withGroupDividers && showHotel && (
                <span className="hidden h-10 w-px bg-brand-navy/10 dark:bg-brand-light/10 lg:block" aria-hidden="true" />
            )}
            {!useProfileDropdown && <LanguageSwitcher compact={compact} />}

            {primaryAction && (
                <button
                    type="button"
                    onClick={() => navigate(primaryAction.to)}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint/90"
                >
                    <ActionIcon size={16} />
                    <span className="hidden xl:inline">{primaryAction.label}</span>
                </button>
            )}

            {useProfileDropdown ? (
                <UserProfileDropdown roleLabel={roleLabel} />
            ) : (
                <>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-light/60 bg-brand-light/70 text-brand-slate shadow-sm backdrop-blur-xl transition-colors hover:bg-brand-light/80 hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/80 dark:hover:bg-brand-light/8 dark:hover:text-brand-light"
                        aria-label={t('common:actions.toggleTheme', { defaultValue: 'Toggle theme' })}
                    >
                        {isDark ? <Sun size={17} /> : <Moon size={17} />}
                    </button>

                    <div className={clsx(
                        'hidden min-w-0 items-center rounded-2xl border border-brand-light/60 bg-brand-light/72 shadow-sm backdrop-blur-xl md:flex dark:border-brand-light/10 dark:bg-brand-light/5',
                        compactAccount ? 'gap-1.5 px-2 py-1.5' : 'gap-3 px-3 py-2',
                    )}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-mint/14 text-sm font-bold text-brand-mint">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div className={clsx('min-w-0', compactAccount && 'hidden')}>
                            <p className="truncate text-sm font-semibold text-brand-navy dark:text-brand-light">
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
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-brand-slate transition-colors hover:bg-brand-mint/10 hover:text-brand-mint dark:hover:bg-brand-mint/15"
                            aria-label={t('common:actions.logOut', { defaultValue: 'Log out' })}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
