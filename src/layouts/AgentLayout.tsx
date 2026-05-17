import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRoleNavigation } from './navigation';
import { HeaderActions } from './LayoutControls';
import { Logo } from '../components/ui/Logo';

export default function AgentLayout() {
    const { t } = useTranslation(['auth', 'common']);
    const roleNavigation = getRoleNavigation('AGENT');

    return (
        <div className="relative min-h-screen overflow-hidden bg-brand-light dark:bg-brand-navy">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-brand-navy/10 dark:bg-brand-light/10" />

            <div className="relative flex min-h-screen flex-col">
                <header className="relative z-50 px-3 pt-3 md:px-5 md:pt-4">
                    <div className="mx-auto max-w-[1480px]">
                        <div className="premium-nav-glass overflow-visible rounded-[24px] px-4 py-3 shadow-sm md:px-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div className="flex h-14 shrink-0 items-center rounded-2xl border border-brand-light/65 bg-brand-light/70 px-3 shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/5">
                                        <Logo className="scale-95" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-slate/85">
                                            {roleNavigation.eyebrowKey ? t(roleNavigation.eyebrowKey, { defaultValue: roleNavigation.eyebrow }) : roleNavigation.eyebrow}
                                        </p>
                                        <h1 className="truncate text-lg font-semibold leading-6 tracking-tight text-brand-navy dark:text-brand-light">
                                            {roleNavigation.titleKey ? t(roleNavigation.titleKey, { defaultValue: roleNavigation.title }) : roleNavigation.title}
                                        </h1>
                                        <p className="mt-1 hidden max-w-2xl truncate text-sm font-medium text-brand-slate dark:text-brand-light/70 md:block">
                                            {roleNavigation.subtitleKey ? t(roleNavigation.subtitleKey, { defaultValue: roleNavigation.subtitle }) : roleNavigation.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <HeaderActions
                                    roleLabel={roleNavigation.labelKey ? t(roleNavigation.labelKey, { defaultValue: roleNavigation.label }) : roleNavigation.label}
                                    compact
                                    compactAccount
                                    withGroupDividers
                                    useProfileDropdown
                                    className="lg:justify-end"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="relative z-0 flex-1 overflow-y-auto px-3 pb-6 pt-5 md:px-5">
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
