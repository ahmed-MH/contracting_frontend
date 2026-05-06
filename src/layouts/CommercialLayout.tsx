import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import {
    ChevronDown,
    Menu,
    X,
} from 'lucide-react';
import {
    commercialTopNavGroups,
    commercialTopNavItems,
    isNavigationItemActive,
} from './navigation';
import { HotelSelector, UserProfileDropdown } from './LayoutControls';
import { Logo } from '../components/ui/Logo';

export default function CommercialLayout() {
    const { t } = useTranslation(['auth', 'common']);
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openGroupTitle, setOpenGroupTitle] = useState<string | null>(null);
    const topNavRef = useRef<HTMLElement>(null);

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
                                            'pricify-dropdown-surface translate-y-1 transition group-focus-within:translate-y-0 group-hover:translate-y-0',
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
                                                            'pricify-dropdown-item items-start gap-3 py-3',
                                                            isActive
                                                                ? 'bg-brand-mint/12 text-brand-mint'
                                                                : '',
                                                        )}
                                                        onClick={() => setOpenGroupTitle(null)}
                                                    >
                                                        <Icon size={17} className="mt-0.5 shrink-0" />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-semibold">
                                                                {item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}
                                                            </span>
                                                            {itemDescription && (
                                                                <span className="pricify-dropdown-description">
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
