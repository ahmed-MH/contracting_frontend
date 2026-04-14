import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, FileText, Calculator, Building2, Moon, Sun } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useTheme } from '../hooks/useTheme';

export default function AuthLayout() {
    const { t } = useTranslation('common');
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen w-full flex font-inter selection:bg-brand-mint/20 bg-brand-light dark:bg-brand-navy">
            <div className="w-full md:w-[52%] lg:w-[46%] xl:w-[44%] min-h-screen flex flex-col bg-brand-light dark:bg-brand-navy relative z-10">
                <div className="shrink-0 px-8 sm:px-12 pt-8 sm:pt-10 pb-4 flex items-center justify-between gap-4">
                    <Link
                        to="/"
                        className="inline-block rounded-xl transition-transform hover:scale-[1.03] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mint focus-visible:ring-offset-2"
                    >
                        <Logo />
                    </Link>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher compact />
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-slate/20 bg-brand-light text-brand-slate shadow-sm transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                            aria-label={t('actions.toggleTheme', { defaultValue: 'Toggle theme' })}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-14 xl:px-16">
                    <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                        <Outlet />
                    </div>
                </div>

                <div className="shrink-0 px-8 sm:px-12 pb-7 sm:pb-9 flex flex-col items-center text-center gap-0.5">
                    <p className="text-[11px] font-medium text-brand-slate/65 dark:text-brand-light/45">
                        {t('authLayout.footer.copyright', {
                            defaultValue: '© {{year}} Pricify B2B - All rights reserved.',
                            year: new Date().getFullYear(),
                        })}
                    </p>
                    <a
                        href="mailto:support@pricify.com"
                        className="text-[11px] font-medium text-brand-slate/65 dark:text-brand-light/45 hover:text-brand-mint transition-colors"
                    >
                        support@pricify.com
                    </a>
                </div>
            </div>

            <div className="hidden md:block md:w-[48%] lg:w-[54%] xl:w-[56%] relative overflow-hidden">
                <div className="sticky top-0 h-screen flex flex-col">
                    <div className="absolute inset-0 bg-brand-navy" />
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy to-brand-mint/20" />

                    <div
                        className="absolute top-[8%] left-[8%] w-[380px] h-[380px] rounded-full bg-brand-mint/[0.08] blur-[90px] pointer-events-none"
                        style={{ animation: 'pulse 8s ease-in-out infinite' }}
                    />
                    <div
                        className="absolute bottom-[5%] right-[0%] w-[450px] h-[450px] rounded-full bg-brand-light/[0.06] blur-[110px] pointer-events-none"
                        style={{ animation: 'pulse 11s ease-in-out infinite' }}
                    />

                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, color-mix(in srgb, var(--color-brand-light) 6%, transparent) 1px, transparent 1px)',
                            backgroundSize: '28px 28px',
                        }}
                    />

                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-light/[0.06] to-transparent" />

                    <div className="relative z-10 flex flex-col h-full px-10 md:px-12 xl:px-16 py-10 xl:py-12">
                        <div className="shrink-0">
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-brand-light/[0.05] border border-brand-light/[0.09] backdrop-blur-sm">
                                <span className="flex h-2 w-2 rounded-full bg-brand-mint shadow-sm animate-pulse" />
                                <span className="text-[11px] font-semibold text-brand-light/80 tracking-[0.13em] uppercase">
                                    {t('authLayout.badge', { defaultValue: 'Pricify Contracting' })}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-6 py-8">
                            <div>
                                <h2 className="text-[2rem] xl:text-[3rem] font-black text-brand-light leading-[1.1] tracking-tight mb-4">
                                    {t('authLayout.hero.titleLine1', { defaultValue: 'Contracting' })} <br />
                                    {t('authLayout.hero.titleLine2Prefix', { defaultValue: 'Hospitality' })}{' '}
                                    <span className="text-brand-mint">{t('authLayout.hero.titleAccent', { defaultValue: 'Reinvented.' })}</span>
                                </h2>
                                <p className="text-brand-light/70 text-[14px] xl:text-[16px] font-medium leading-relaxed max-w-[400px]">
                                    {t('authLayout.hero.subtitle', { defaultValue: 'Centralize tour-operator contracts, manage your rate grids, and drive arrangements from one interface.' })}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 max-w-[480px] xl:grid-cols-2">
                                <div className="group p-4 rounded-xl bg-brand-light/[0.03] border border-brand-light/[0.08] hover:border-brand-mint/30 hover:bg-brand-light/[0.055] backdrop-blur-sm transition-all duration-300">
                                    <div className="w-8 h-8 rounded-xl bg-brand-mint/10 flex items-center justify-center mb-2.5">
                                        <FileText size={15} className="text-brand-mint" />
                                    </div>
                                    <p className="text-[13px] font-bold text-brand-light mb-1 leading-tight">
                                        {t('authLayout.cards.contracts.title', { defaultValue: 'Contract management' })}
                                    </p>
                                    <p className="text-[11.5px] text-brand-light/55 font-medium leading-snug">
                                        {t('authLayout.cards.contracts.copy', { defaultValue: 'Periods, seasons, and conditions centralized.' })}
                                    </p>
                                </div>

                                <div className="group p-4 rounded-xl bg-brand-light/[0.03] border border-brand-light/[0.08] hover:border-brand-mint/30 hover:bg-brand-light/[0.055] backdrop-blur-sm transition-all duration-300">
                                    <div className="w-8 h-8 rounded-xl bg-brand-mint/10 flex items-center justify-center mb-2.5">
                                        <BarChart3 size={15} className="text-brand-mint" />
                                    </div>
                                    <p className="text-[13px] font-bold text-brand-light mb-1 leading-tight">
                                        {t('authLayout.cards.rates.title', { defaultValue: 'Rate grids' })}
                                    </p>
                                    <p className="text-[11.5px] text-brand-light/55 font-medium leading-snug">
                                        {t('authLayout.cards.rates.copy', { defaultValue: 'By room, arrangement, and season.' })}
                                    </p>
                                </div>

                                <div className="group p-4 rounded-xl bg-brand-light/[0.03] border border-brand-light/[0.08] hover:border-brand-mint/30 hover:bg-brand-light/[0.055] backdrop-blur-sm transition-all duration-300">
                                    <div className="w-8 h-8 rounded-xl bg-brand-mint/10 flex items-center justify-center mb-2.5">
                                        <Calculator size={15} className="text-brand-mint" />
                                    </div>
                                    <p className="text-[13px] font-bold text-brand-light mb-1 leading-tight">
                                        {t('authLayout.cards.simulator.title', { defaultValue: 'Price simulator' })}
                                    </p>
                                    <p className="text-[11.5px] text-brand-light/55 font-medium leading-snug">
                                        {t('authLayout.cards.simulator.copy', { defaultValue: 'Selling prices calculated in real time.' })}
                                    </p>
                                </div>

                                <div className="group p-4 rounded-xl bg-brand-light/[0.03] border border-brand-light/[0.08] hover:border-brand-mint/30 hover:bg-brand-light/[0.055] backdrop-blur-sm transition-all duration-300">
                                    <div className="w-8 h-8 rounded-xl bg-brand-mint/10 flex items-center justify-center mb-2.5">
                                        <Building2 size={15} className="text-brand-mint" />
                                    </div>
                                    <p className="text-[13px] font-bold text-brand-light mb-1 leading-tight">
                                        {t('authLayout.cards.multiHotel.title', { defaultValue: 'Multi-hotels' })}
                                    </p>
                                    <p className="text-[11.5px] text-brand-light/55 font-medium leading-snug">
                                        {t('authLayout.cards.multiHotel.copy', { defaultValue: 'Rooms, supplements, and reductions.' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <span className="text-[11px] font-medium text-brand-light/45 tracking-wide">
                                {t('authLayout.brandline', { defaultValue: 'Pricify - Hotel contracting platform' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
