import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminSections, getRoleNavigation, isNavigationItemActive } from './navigation';
import { BrandLockup, HeaderActions } from './LayoutControls';
import { Logo } from '../components/ui/Logo';
import { useUsers } from '../features/admin/hooks/useUsers';
import { useHotels } from '../features/hotel/hooks/useHotels';

const SIDEBAR_STORAGE_KEY = 'adminSidebarCollapsed';

function getAccountStatus(user: { isActive: boolean; accountStatus?: string }): 'ACTIVE' | 'PENDING_INVITE' | 'SUSPENDED' {
    if (user.accountStatus === 'ACTIVE' || user.accountStatus === 'PENDING_INVITE' || user.accountStatus === 'SUSPENDED') {
        return user.accountStatus;
    }

    return user.isActive ? 'ACTIVE' : 'PENDING_INVITE';
}

function SidebarInsight() {
    const { t } = useTranslation('common');
    const { data: users = [], isLoading: usersLoading, isError: usersError } = useUsers();
    const { data: hotels = [], isLoading: hotelsLoading, isError: hotelsError } = useHotels();
    const isLoading = usersLoading || hotelsLoading;
    const hasError = usersError || hotelsError;

    const activeUsers = users.filter((user) => getAccountStatus(user) === 'ACTIVE').length;
    const pendingUsers = users.filter((user) => getAccountStatus(user) === 'PENDING_INVITE').length;
    const assignedHotelIds = new Set(
        users
            .filter((user) => user.role === 'COMMERCIAL' && getAccountStatus(user) === 'ACTIVE')
            .flatMap((user) => user.hotels?.map((hotel) => hotel.id) ?? []),
    );
    const unassignedHotels = Math.max(0, hotels.length - assignedHotelIds.size);
    const primarySignal = pendingUsers > 0
        ? t('layouts.admin.sidebarInsight.pendingInvites', {
            defaultValue: '{{count}} pending invite needs review.',
            count: pendingUsers,
        })
        : unassignedHotels > 0
            ? t('layouts.admin.sidebarInsight.unassignedHotels', {
                defaultValue: '{{count}} hotel needs an owner.',
                count: unassignedHotels,
            })
            : t('layouts.admin.sidebarInsight.ready', {
                defaultValue: 'Access and hotel ownership look current.',
            });

    return (
        <div className="mt-auto overflow-hidden rounded-2xl border border-brand-mint/20 bg-brand-mint/8 p-4 shadow-sm dark:border-brand-mint/25 dark:bg-brand-mint/12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-mint">
                {t('layouts.admin.sidebarInsight.title', { defaultValue: 'Workspace Signals' })}
            </p>
            {isLoading ? (
                <div className="mt-3 animate-pulse space-y-2">
                    <div className="h-4 w-4/5 rounded-full bg-brand-slate/15 dark:bg-brand-light/10" />
                    <div className="h-3 w-full rounded-full bg-brand-slate/15 dark:bg-brand-light/10" />
                </div>
            ) : hasError ? (
                <p className="mt-2 text-sm text-brand-slate dark:text-brand-light/75">
                    {t('layouts.admin.sidebarInsight.unavailable', { defaultValue: 'Workspace signals are unavailable right now.' })}
                </p>
            ) : (
                <>
                    <p className="mt-3 text-sm font-semibold leading-5 text-brand-navy dark:text-brand-light">
                        {primarySignal}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-brand-slate dark:text-brand-light/70">
                        {t('layouts.admin.sidebarInsight.summary', {
                            defaultValue: '{{active}} active seats, {{assigned}}/{{total}} hotels covered.',
                            active: activeUsers,
                            assigned: assignedHotelIds.size,
                            total: hotels.length,
                        })}
                    </p>
                </>
            )}
        </div>
    );
}

export default function AdminLayout() {
    const { t } = useTranslation(['auth', 'common']);
    const location = useLocation();
    const roleNavigation = getRoleNavigation('ADMIN');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        setIsSidebarCollapsed(saved === 'true');
    }, []);

    useEffect(() => {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    const activeItem = useMemo(
        () =>
            adminSections
                .flatMap((section) => section.items)
                .find((item) => isNavigationItemActive(location.pathname, item)),
        [location.pathname],
    );

    return (
        <div className="relative min-h-screen overflow-hidden bg-brand-light dark:bg-brand-navy">
            <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-brand-mint/10 blur-3xl dark:bg-brand-mint/12" />

            <div className="relative flex min-h-screen">
                <aside
                    className={clsx(
                        'hidden shrink-0 border-r border-brand-light/60 bg-brand-light/72 px-4 py-5 shadow-md backdrop-blur-2xl transition-[width,padding] duration-300 dark:border-brand-light/10 dark:bg-brand-navy/72 lg:flex lg:flex-col',
                        isSidebarCollapsed ? 'w-[104px]' : 'w-[320px]',
                    )}
                >
                    <div
                        className={clsx(
                            'rounded-2xl border border-brand-light/70 bg-brand-light/80 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5',
                            isSidebarCollapsed ? 'p-4' : 'px-4 py-3',
                        )}
                    >
                        <div className={clsx('flex items-center', isSidebarCollapsed ? 'justify-center' : 'gap-3')}>
                            {isSidebarCollapsed ? (
                                <div className="flex h-12 w-12 items-center justify-center">
                                    <Logo variant="mark" />
                                </div>
                            ) : (
                                <>
                                    <Logo />
                                    <div>
                                        <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                            {t('common:navigation.roles.admin.label', { defaultValue: 'Admin' })}
                                        </p>
                                        <p className="mt-0.5 text-xs text-brand-slate dark:text-brand-light/65">
                                            {t('common:layouts.admin.sidebar.organizationControlsOnly', { defaultValue: 'Organization controls only' })}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className={clsx('space-y-6', isSidebarCollapsed ? 'mt-6' : 'mt-8')}>
                        {adminSections.map((section) => (
                            <div key={section.title}>
                                {!isSidebarCollapsed && (
                                    <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate/80">
                                        {section.titleKey ? t(section.titleKey, { defaultValue: section.title }) : section.title}
                                    </p>
                                )}
                                <div className={clsx(isSidebarCollapsed ? 'space-y-3' : 'mt-3 space-y-2')}>
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = isNavigationItemActive(location.pathname, item);
                                        const label = item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label;
                                        const description = item.descriptionKey
                                            ? t(item.descriptionKey, { defaultValue: item.description })
                                            : item.description;

                                        return (
                                            <NavLink
                                                key={item.to}
                                                to={item.to}
                                                title={label}
                                                className={clsx(
                                                    'group relative transition',
                                                    isSidebarCollapsed
                                                        ? [
                                                            'flex h-12 items-center justify-center rounded-2xl border',
                                                            isActive
                                                                ? 'border-brand-mint/25 bg-brand-light/80 text-brand-navy shadow-sm ring-1 ring-brand-mint/15 dark:border-brand-mint/25 dark:bg-brand-light/8 dark:text-brand-light'
                                                                : 'border-transparent text-brand-slate hover:border-brand-slate/15 hover:bg-brand-light/75 hover:text-brand-navy dark:text-brand-light/70 dark:hover:border-brand-light/10 dark:hover:bg-brand-light/6 dark:hover:text-brand-light',
                                                        ]
                                                        : [
                                                            'block overflow-hidden rounded-2xl border px-3 py-3 shadow-sm',
                                                            isActive
                                                                ? 'border-brand-mint/35 bg-brand-mint/12 text-brand-navy dark:bg-brand-mint/12 dark:text-brand-light'
                                                                : 'border-brand-light/50 bg-brand-light/56 text-brand-slate hover:border-brand-mint/25 hover:bg-brand-light/90 hover:text-brand-navy dark:border-brand-light/8 dark:bg-brand-light/[0.04] dark:hover:border-brand-mint/25 dark:hover:bg-brand-light/8 dark:hover:text-brand-light',
                                                        ],
                                                )}
                                            >
                                                {!isSidebarCollapsed && (
                                                    <span className={clsx(
                                                        'absolute inset-y-3 left-0 w-1 rounded-r-full transition',
                                                        isActive ? 'bg-brand-mint' : 'bg-transparent group-hover:bg-brand-mint/40',
                                                    )} />
                                                )}
                                                <div className={clsx('flex', isSidebarCollapsed ? 'items-center justify-center' : 'items-start gap-3 pl-1')}>
                                                    <div className={clsx(
                                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition',
                                                        isActive
                                                            ? 'bg-brand-mint text-brand-light ring-brand-mint/30 shadow-sm'
                                                            : 'bg-brand-light/75 text-brand-slate ring-brand-slate/10 group-hover:bg-brand-light group-hover:text-brand-navy group-hover:ring-brand-slate/20 dark:bg-brand-light/[0.04] dark:text-brand-light/65 dark:ring-brand-light/10 dark:group-hover:bg-brand-light/8 dark:group-hover:text-brand-light',
                                                    )}>
                                                        <Icon size={17} />
                                                    </div>

                                                    {!isSidebarCollapsed && (
                                                        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-semibold">
                                                                    {label}
                                                                </p>
                                                                {description && (
                                                                <p className={clsx(
                                                                    'mt-1 text-xs leading-5',
                                                                    isActive ? 'text-brand-slate dark:text-brand-light/78' : 'text-brand-slate dark:text-brand-light/70',
                                                                )}>
                                                                    {description}
                                                                </p>
                                                                )}
                                                            </div>
                                                            <ArrowRight
                                                                size={15}
                                                                className={clsx(
                                                                    'mt-1 shrink-0 transition',
                                                                    isActive ? 'text-brand-mint' : 'text-brand-slate/55 group-hover:translate-x-0.5 group-hover:text-brand-mint',
                                                                )}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isSidebarCollapsed && <SidebarInsight />}
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 border-b border-brand-light/55 bg-brand-light/74 backdrop-blur-2xl dark:border-brand-light/10 dark:bg-brand-navy/70">
                        <div className="px-4 py-3 md:px-6 lg:px-8">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="lg:hidden">
                                    <BrandLockup
                                        eyebrow={roleNavigation.eyebrowKey ? t(roleNavigation.eyebrowKey, { defaultValue: roleNavigation.eyebrow }) : roleNavigation.eyebrow}
                                        title={roleNavigation.titleKey ? t(roleNavigation.titleKey, { defaultValue: roleNavigation.title }) : roleNavigation.title}
                                        subtitle={roleNavigation.subtitleKey ? t(roleNavigation.subtitleKey, { defaultValue: roleNavigation.subtitle }) : roleNavigation.subtitle}
                                    />
                                </div>

                                <div className="hidden lg:flex lg:items-center lg:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarCollapsed((value) => !value)}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-light/60 bg-brand-light/70 text-brand-slate shadow-sm backdrop-blur-xl transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                                        aria-label={isSidebarCollapsed
                                            ? t('common:layouts.admin.sidebar.expandSidebar', { defaultValue: 'Expand sidebar' })
                                            : t('common:layouts.admin.sidebar.collapseSidebar', { defaultValue: 'Collapse sidebar' })}
                                    >
                                        {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                                    </button>

                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate/85">
                                            {t('common:layouts.admin.workspace', { defaultValue: 'Admin workspace' })}
                                        </p>
                                        <div className="mt-1">
                                            <h1 className="text-lg font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                                {activeItem
                                                    ? (activeItem.labelKey
                                                        ? t(activeItem.labelKey, { defaultValue: activeItem.label })
                                                        : activeItem.label)
                                                    : (roleNavigation.titleKey
                                                        ? t(roleNavigation.titleKey, { defaultValue: roleNavigation.title })
                                                        : roleNavigation.title)}
                                            </h1>
                                            {activeItem?.description && (
                                                <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/75">
                                                    {activeItem.descriptionKey
                                                        ? t(activeItem.descriptionKey, { defaultValue: activeItem.description })
                                                        : activeItem.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <HeaderActions
                                    roleLabel={roleNavigation.labelKey ? t(roleNavigation.labelKey, { defaultValue: roleNavigation.label }) : roleNavigation.label}
                                    useProfileDropdown
                                />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-3 lg:hidden">
                                {adminSections.flatMap((section) => section.items).map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isNavigationItemActive(location.pathname, item);

                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            className={clsx(
                                                'premium-nav-glass flex items-center gap-2 px-3 py-2 text-sm font-medium transition',
                                                isActive
                                                    ? 'border-brand-mint/20 bg-brand-navy text-brand-light'
                                                    : 'text-brand-slate hover:text-brand-navy dark:hover:text-brand-light',
                                            )}
                                        >
                                            <Icon size={15} />
                                            <span>{item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    </header>

                    <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-6 pt-4 md:px-4 lg:px-6">
                        <div className="mx-auto w-full min-w-0 max-w-[1520px]">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
