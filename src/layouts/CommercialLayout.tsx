import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import {
    commercialPrimaryTabs,
    commercialProductTabs,
    getRoleNavigation,
    isNavigationItemActive,
    isProductRoute,
} from './navigation';
import { BrandLockup, HeaderActions, HotelSelector } from './LayoutControls';

export default function CommercialLayout() {
    const { t } = useTranslation(['auth', 'common']);
    const location = useLocation();
    const roleNavigation = getRoleNavigation('COMMERCIAL');
    const activePrimary = commercialPrimaryTabs.find((item) => isNavigationItemActive(location.pathname, item)) ?? commercialPrimaryTabs[0];
    const showProductTabs = isProductRoute(location.pathname);

    return (
        <div className="relative min-h-screen overflow-hidden bg-brand-light dark:bg-brand-navy">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-brand-navy/10 dark:bg-brand-light/10" />

            <div className="relative flex min-h-screen flex-col">
                <header className="sticky top-0 z-30 border-b border-white/55 bg-brand-light/72 backdrop-blur-2xl dark:border-white/10 dark:bg-brand-navy/70">
                    <div className="px-4 pb-4 pt-4 md:px-6 lg:px-8">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <BrandLockup
                                eyebrow={roleNavigation.eyebrowKey ? t(roleNavigation.eyebrowKey, { defaultValue: roleNavigation.eyebrow }) : roleNavigation.eyebrow}
                                title={roleNavigation.titleKey ? t(roleNavigation.titleKey, { defaultValue: roleNavigation.title }) : roleNavigation.title}
                                subtitle={roleNavigation.subtitleKey ? t(roleNavigation.subtitleKey, { defaultValue: roleNavigation.subtitle }) : roleNavigation.subtitle}
                            />
                            <HeaderActions
                                roleLabel={roleNavigation.labelKey ? t(roleNavigation.labelKey, { defaultValue: roleNavigation.label }) : roleNavigation.label}
                                primaryAction={{ label: t('common:actions.newContract', { defaultValue: 'New Contract' }), to: '/contracts' }}
                            />
                        </div>

                        <div className="mt-4 flex flex-col gap-3">
                            <div className="premium-nav-glass flex flex-wrap items-center gap-2 p-2">
                                {commercialPrimaryTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = isNavigationItemActive(location.pathname, tab);

                                    return (
                                        <NavLink
                                            key={tab.to}
                                            to={tab.to}
                                            className={clsx(
                                                'flex min-w-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                                                isActive
                                                    ? 'bg-brand-navy text-white shadow-md'
                                                    : 'text-brand-slate hover:bg-white/70 hover:text-brand-navy dark:hover:bg-white/8 dark:hover:text-white',
                                            )}
                                        >
                                            <Icon size={16} />
                                            <span>
                                                {tab.labelKey ? t(tab.labelKey, { defaultValue: tab.label }) : tab.label}
                                            </span>
                                        </NavLink>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="premium-surface flex-1 px-4 py-4">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-slate">
                                                {t('common:layouts.commercial.activeWorkspace', { defaultValue: 'Active Workspace' })}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                                <h2 className="text-xl font-semibold tracking-tight text-brand-navy dark:text-white">
                                                    {activePrimary.labelKey ? t(activePrimary.labelKey, { defaultValue: activePrimary.label }) : activePrimary.label}
                                                </h2>
                                                <span className="premium-pill border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                                                    {t('common:layouts.commercial.productionFlow', { defaultValue: 'Production Flow' })}
                                                </span>
                                            </div>
                                            <p className="mt-2 max-w-3xl text-sm text-brand-slate dark:text-brand-light/80">
                                                {activePrimary.descriptionKey
                                                    ? t(activePrimary.descriptionKey, { defaultValue: activePrimary.description ?? '' })
                                                    : (activePrimary.description ?? '')}
                                            </p>
                                        </div>
                                        <HotelSelector className="lg:hidden" />
                                    </div>
                                </div>
                            </div>

                            {showProductTabs && (
                                <div className="premium-nav-glass flex items-center gap-2 overflow-x-auto p-2">
                                    {commercialProductTabs.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.to;

                                        return (
                                            <NavLink
                                                key={item.to}
                                                to={item.to}
                                                className={clsx(
                                                    'flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition',
                                                    isActive
                                                        ? 'bg-brand-mint text-white'
                                                        : 'text-brand-slate hover:bg-white/70 hover:text-brand-navy dark:hover:bg-white/8 dark:hover:text-white',
                                                )}
                                            >
                                                <Icon size={15} />
                                                <span>
                                                    {item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}
                                                </span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-2 pb-6 pt-4 md:px-4 lg:px-6">
                    <div className="mx-auto max-w-[1680px]">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
