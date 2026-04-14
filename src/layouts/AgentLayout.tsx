import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { agentTabs, getRoleNavigation, isNavigationItemActive } from './navigation';
import { BrandLockup, HeaderActions } from './LayoutControls';

export default function AgentLayout() {
    const { t } = useTranslation(['auth', 'common']);
    const location = useLocation();
    const roleNavigation = getRoleNavigation('AGENT');

    return (
        <div className="relative min-h-screen overflow-hidden bg-brand-light dark:bg-brand-navy">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-brand-navy/10 dark:bg-brand-light/10" />

            <div className="relative flex min-h-screen flex-col">
                <header className="px-3 pt-3 md:px-5 md:pt-5">
                    <div className="mx-auto max-w-[1480px]">
                        <div className="premium-nav-glass rounded-2xl px-4 py-4 md:px-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <BrandLockup
                                    eyebrow={roleNavigation.eyebrowKey ? t(roleNavigation.eyebrowKey, { defaultValue: roleNavigation.eyebrow }) : roleNavigation.eyebrow}
                                    title={roleNavigation.titleKey ? t(roleNavigation.titleKey, { defaultValue: roleNavigation.title }) : roleNavigation.title}
                                    subtitle={roleNavigation.subtitleKey ? t(roleNavigation.subtitleKey, { defaultValue: roleNavigation.subtitle }) : roleNavigation.subtitle}
                                />
                                <HeaderActions
                                    roleLabel={roleNavigation.labelKey ? t(roleNavigation.labelKey, { defaultValue: roleNavigation.label }) : roleNavigation.label}
                                    primaryAction={{ label: t('common:layouts.agent.runPricing', { defaultValue: 'Run Pricing' }), to: '/simulator' }}
                                    compact
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {agentTabs.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isNavigationItemActive(location.pathname, item);

                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            className={clsx(
                                                'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition',
                                                isActive
                                                    ? 'bg-brand-navy text-brand-light shadow-md'
                                                    : 'bg-brand-light/65 text-brand-slate hover:text-brand-navy dark:bg-brand-light/5 dark:hover:text-brand-light',
                                            )}
                                        >
                                            <Icon size={15} />
                                            <span>{item.labelKey ? t(item.labelKey, { defaultValue: item.label }) : item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-3 pb-6 pt-4 md:px-5">
                    <div className="mx-auto max-w-[1480px]">
                        <div className="premium-surface min-h-[calc(100vh-180px)] overflow-hidden rounded-2xl">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
