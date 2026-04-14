import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import {
    ChevronDown,
    FileText,
    LogOut,
    Menu,
    Moon,
    Sun,
    X,
} from 'lucide-react';
import {
    commercialTopNavGroups,
    commercialTopNavItems,
    isNavigationItemActive,
} from './navigation';
import { HotelSelector } from './LayoutControls';
import { Logo } from '../components/ui/Logo';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useHotel } from '../features/hotel/context/HotelContext';
import { useContract } from '../features/contracts/hooks/useContracts';
import { useAuth } from '../features/auth/context/AuthContext';
import { useTheme } from '../hooks/useTheme';

function UserProfileDropdown({ roleLabel }: { roleLabel: string }) {
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
                    'translate-y-1 rounded-lg border border-brand-slate/15 bg-brand-light p-2 shadow-xl transition group-focus-within:translate-y-0 group-hover:translate-y-0 dark:border-brand-light/10 dark:bg-brand-navy',
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
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-brand-slate transition hover:bg-brand-mint/8 hover:text-brand-navy dark:text-brand-light/70 dark:hover:text-brand-light"
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
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-brand-slate transition hover:bg-brand-mint/8 hover:text-brand-navy dark:text-brand-light/70 dark:hover:text-brand-light"
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

export default function CommercialLayout() {
    const { t } = useTranslation(['auth', 'common']);
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openGroupTitle, setOpenGroupTitle] = useState<string | null>(null);
    const topNavRef = useRef<HTMLElement>(null);
    const contractMatch = useMatch('/contracts/:id/*');
    const contractId = contractMatch?.params.id ? Number(contractMatch.params.id) : undefined;
    const { currentHotel } = useHotel();
    const { data: activeContract } = useContract(
        currentHotel && Number.isFinite(contractId) ? contractId : undefined,
    );

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setOpenGroupTitle(null);
    }, [location.pathname]);

    useEffect(() => {
        if (!openGroupTitle) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!topNavRef.current?.contains(event.target as Node)) {
                setOpenGroupTitle(null);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [openGroupTitle]);

    return (
        <div className="min-h-screen bg-brand-light text-brand-navy dark:bg-brand-navy dark:text-brand-light">
            <header className="sticky top-0 z-40 border-b border-brand-slate/15 bg-brand-light/92 shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-navy/92">
                <div className="mx-auto flex max-w-[1680px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <Link to="/contracts" className="shrink-0 rounded-lg border border-brand-slate/10 bg-brand-light px-3 py-2 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <Logo className="scale-90" />
                    </Link>

                    <nav ref={topNavRef} className="hidden flex-1 items-center gap-1 lg:flex" aria-label={t('common:navigation.roles.commercial.sectionTitle', { defaultValue: 'Workspace' })}>
                        {commercialTopNavGroups.map((group) => {
                            const isActiveGroup = group.items.some((item) => isNavigationItemActive(location.pathname, item));
                            const isOpenGroup = openGroupTitle === group.title;
                            const groupLabel = group.titleKey ? t(group.titleKey, { defaultValue: group.title }) : group.title;
                            const groupMenuId = `commercial-group-${group.title.toLowerCase().replace(/\s+/g, '-')}`;

                            return (
                                <div key={group.title} className="group relative">
                                    <button
                                        type="button"
                                        aria-haspopup="menu"
                                        aria-expanded={isOpenGroup}
                                        aria-controls={groupMenuId}
                                        onClick={() =>
                                            setOpenGroupTitle((current) => (current === group.title ? null : group.title))
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'Escape') {
                                                setOpenGroupTitle(null);
                                            }
                                        }}
                                        className={clsx(
                                            'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors',
                                            isActiveGroup
                                                ? 'bg-brand-mint/12 text-brand-mint'
                                                : 'text-brand-slate hover:bg-brand-mint/8 hover:text-brand-navy dark:text-brand-light/70 dark:hover:text-brand-light',
                                        )}
                                    >
                                        {groupLabel}
                                        <ChevronDown size={14} />
                                    </button>

                                    <div
                                        id={groupMenuId}
                                        role="menu"
                                        className={clsx(
                                            'absolute left-0 top-full z-40 w-72 pt-2 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100',
                                            isOpenGroup ? 'visible opacity-100' : 'invisible opacity-0',
                                        )}
                                    >
                                        <div className={clsx(
                                            'translate-y-1 rounded-lg border border-brand-slate/15 bg-brand-light p-2 shadow-xl transition group-focus-within:translate-y-0 group-hover:translate-y-0 dark:border-brand-light/10 dark:bg-brand-navy',
                                            isOpenGroup && 'translate-y-0',
                                        )}>
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                const isActive = isNavigationItemActive(location.pathname, item);
                                                const itemDescription = item.descriptionKey
                                                    ? t(item.descriptionKey, { defaultValue: item.description })
                                                    : item.description;

                                                return (
                                                    <NavLink
                                                        key={item.to}
                                                        to={item.to}
                                                        role="menuitem"
                                                        className={clsx(
                                                            'flex items-start gap-3 rounded-lg px-3 py-3 transition-colors',
                                                            isActive
                                                                ? 'bg-brand-mint/12 text-brand-mint'
                                                                : 'text-brand-slate hover:bg-brand-mint/8 hover:text-brand-navy dark:text-brand-light/70 dark:hover:text-brand-light',
                                                        )}
                                                        onClick={() => setOpenGroupTitle(null)}
                                                    >
                                                        <Icon size={17} className="mt-0.5 shrink-0" />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-semibold">
                                                                {item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}
                                                            </span>
                                                            {itemDescription && (
                                                                <span className="mt-0.5 block text-xs leading-5 text-brand-slate dark:text-brand-light/45">
                                                                    {itemDescription}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {commercialTopNavItems.map((item) => {
                            const isActive = isNavigationItemActive(location.pathname, item);

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={clsx(
                                        'inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition-colors',
                                        isActive
                                            ? 'bg-brand-mint/12 text-brand-mint'
                                            : 'text-brand-slate hover:bg-brand-mint/8 hover:text-brand-navy dark:text-brand-light/70 dark:hover:text-brand-light',
                                    )}
                                >
                                    {item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="ml-auto hidden min-w-0 items-center gap-2 lg:flex">
                        <HotelSelector compact className="w-[230px]" />
                        {contractId && (
                            <div className="inline-flex h-10 min-w-0 max-w-[280px] items-center gap-2 rounded-lg border border-brand-slate/15 bg-brand-light/75 px-3 text-sm shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                <FileText size={15} className="shrink-0 text-brand-mint" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-slate">
                                    {t('common:entities.contract', { defaultValue: 'Contract' })}
                                </span>
                                <span className="truncate font-semibold text-brand-navy dark:text-brand-light">
                                    {activeContract?.name ?? `#${contractId}`}
                                </span>
                            </div>
                        )}
                        <UserProfileDropdown roleLabel={t('common:navigation.roles.commercial.label', { defaultValue: 'Commercial' })} />
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen((value) => !value)}
                        className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-slate/15 bg-brand-light text-brand-slate shadow-sm transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light lg:hidden"
                        aria-label={isMobileMenuOpen
                            ? t('common:actions.closeMenu', { defaultValue: 'Close menu' })
                            : t('common:actions.openMenu', { defaultValue: 'Open menu' })}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="commercial-mobile-menu"
                    >
                        {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div id="commercial-mobile-menu" className="border-t border-brand-slate/10 bg-brand-light px-4 py-4 shadow-lg dark:border-brand-light/10 dark:bg-brand-navy lg:hidden">
                        <div className="space-y-4">
                            <HotelSelector compact className="w-full" />
                            {contractId && (
                                <div className="flex min-w-0 items-center gap-2 rounded-lg border border-brand-slate/15 bg-brand-light/75 px-3 py-2 text-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <FileText size={15} className="shrink-0 text-brand-mint" />
                                    <span className="truncate font-semibold text-brand-navy dark:text-brand-light">
                                        {activeContract?.name ?? `#${contractId}`}
                                    </span>
                                </div>
                            )}

                            {commercialTopNavGroups.map((group) => (
                                <section key={`mobile-${group.title}`}>
                                    <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-slate">
                                        {group.titleKey ? t(group.titleKey, { defaultValue: group.title }) : group.title}
                                    </p>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = isNavigationItemActive(location.pathname, item);

                                            return (
                                                <NavLink
                                                    key={`mobile-${item.to}`}
                                                    to={item.to}
                                                    className={clsx(
                                                        'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                                                        isActive
                                                            ? 'border-brand-mint/20 bg-brand-mint/12 text-brand-mint'
                                                            : 'border-brand-slate/15 bg-brand-light/70 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/70',
                                                    )}
                                                >
                                                    <Icon size={16} />
                                                    {item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}

                            <div className="grid gap-2 sm:grid-cols-2">
                                {commercialTopNavItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isNavigationItemActive(location.pathname, item);

                                    return (
                                        <NavLink
                                            key={`mobile-direct-${item.to}`}
                                            to={item.to}
                                            className={clsx(
                                                'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                                                isActive
                                                    ? 'border-brand-mint/20 bg-brand-mint/12 text-brand-mint'
                                                    : 'border-brand-slate/15 bg-brand-light/70 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/70',
                                            )}
                                        >
                                            <Icon size={16} />
                                            {item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}
                                        </NavLink>
                                    );
                                })}
                            </div>

                            <UserProfileDropdown roleLabel={t('common:navigation.roles.commercial.label', { defaultValue: 'Commercial' })} />
                        </div>
                    </div>
                )}
            </header>

            <main className="min-w-0 bg-brand-light/80 dark:bg-brand-navy">
                <Outlet />
            </main>
        </div>
    );
}
