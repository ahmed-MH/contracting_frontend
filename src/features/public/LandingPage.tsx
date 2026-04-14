import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowRight,
    BadgeCheck,
    Blocks,
    BriefcaseBusiness,
    Building2,
    Calculator,
    CheckCircle2,
    CircleDollarSign,
    FileStack,
    Globe2,
    Hotel,
    LockKeyhole,
    Moon,
    ShieldCheck,
    Sparkles,
    Sun,
    Users,
    Workflow,
} from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { useTheme } from '../../hooks/useTheme';

const navItems = [
    { key: 'landing.nav.overview', defaultLabel: 'Overview', href: '#platform' },
    { key: 'landing.nav.features', defaultLabel: 'Features', href: '#features' },
    { key: 'landing.nav.roles', defaultLabel: 'Roles', href: '#roles' },
    { key: 'landing.nav.control', defaultLabel: 'Control', href: '#security' },
] as const;

const trustItems = [
    { key: 'landing.trust.groups', defaultLabel: 'Multi-property hotel groups' },
    { key: 'landing.trust.contracting', defaultLabel: 'Commercial contracting teams' },
    { key: 'landing.trust.tour', defaultLabel: 'Tour operator desks' },
    { key: 'landing.trust.pricing', defaultLabel: 'Pricing agents' },
    { key: 'landing.trust.ops', defaultLabel: 'Platform operations' },
] as const;

const heroHighlights = [
    { key: 'landing.hero.highlights.multiHotel', defaultLabel: 'Multi-hotel control' },
    { key: 'landing.hero.highlights.contract', defaultLabel: 'Deep contract logic' },
    { key: 'landing.hero.highlights.quote', defaultLabel: 'Instant quote accuracy' },
] as const;

const heroPills = [
    { key: 'landing.hero.pills.multiProperty', defaultLabel: 'Multi-property control' },
    { key: 'landing.hero.pills.quote', defaultLabel: 'Instant quote accuracy' },
] as const;

const bentoCards = [
    {
        title: 'Multi-property control',
        description:
            'Manage multiple hotels from one centralized workspace, with clear portfolio visibility, shared operational structure, and cleaner control over daily contracting activity.',
        icon: Building2,
        className: 'md:col-span-2 xl:col-span-4',
        tone: 'navy',
        bullets: ['Centralized multi-hotel oversight', 'One operating workspace for every property', 'Cleaner control across your commercial organization'],
    },
    {
        title: 'Contract and SpO engine',
        description:
            'Build, activate, and maintain partner agreements with structured periods, rate grids, supplements, reductions, early booking logic, special offers, and cancellation rules.',
        icon: FileStack,
        className: 'md:col-span-1 xl:col-span-3',
        tone: 'light',
        bullets: ['Partner-linked contracts', 'Granular pricing conditions', 'Lifecycle control from draft to active'],
    },
    {
        title: 'Zero-risk price simulator',
        description:
            'Let agents validate final selling prices against the active contract, booking date, arrangement, rooming list, promotions, and stay modifiers before sharing a quote.',
        icon: Calculator,
        className: 'md:col-span-1 xl:col-span-2',
        tone: 'mint',
        bullets: ['Contract-aware calculations', 'Rooming-list validation', 'Clear nightly and total breakdowns'],
    },
    {
        title: 'Partner and affiliate management',
        description:
            'Keep tour operators, agencies, and B2B travel partners connected to the right commercial conditions, contracts, and communication records in one place.',
        icon: Users,
        className: 'md:col-span-1 xl:col-span-2',
        tone: 'light',
        bullets: ['Affiliate-linked contracts', 'Centralized B2B partner records', 'Faster collaboration with distribution partners'],
    },
    {
        title: 'Director oversight and access control',
        description:
            'Give directors a high-level view of hotels, teams, and permissions while keeping every user focused on the work that matches their responsibility.',
        icon: CircleDollarSign,
        className: 'md:col-span-2 xl:col-span-3',
        tone: 'light',
        bullets: ['Team access and role control', 'Portfolio-wide visibility', 'Cleaner coordination across directors and operators'],
    },
    {
        title: 'Hotel and catalog foundation',
        description:
            'Model hotels, rooms, arrangements, affiliates, and pricing catalogs in one connected flow that feeds every contract and simulator decision.',
        icon: Hotel,
        className: 'md:col-span-2 xl:col-span-4',
        tone: 'light',
        bullets: ['Hotel portfolio and exchange rates', 'Room and arrangement catalogs', 'Supplements, SPOs, reductions, and more'],
    },
] as const;

const roleCards = [
    {
        title: 'Directors',
        subtitle: 'See the big picture across every hotel you manage.',
        icon: ShieldCheck,
        points: [
            'Get a global overview of your hotel portfolio, operational structure, and team organization from one centralized workspace.',
            'Control users, permissions, and hotel access without slowing down contracting and sales activity.',
            'Keep multi-hotel performance and collaboration aligned as your commercial footprint grows.',
        ],
    },
    {
        title: 'Contracting Teams',
        subtitle: 'Set up complex B2B pricing without friction.',
        icon: Workflow,
        points: [
            'Manage hotels, room catalogs, arrangements, affiliates, and contract pricing conditions together in one flow.',
            'Configure rate grids, SPOs, supplements, reductions, early booking rules, and cancellation logic with confidence.',
            'Move from partner setup to contract publication without patching spreadsheets, emails, and disconnected files together.',
        ],
    },
    {
        title: 'Front-Desk',
        subtitle: 'Generate bulletproof quotes in seconds.',
        icon: Sparkles,
        points: [
            'Use the simulator as a focused pricing desk that respects active contracts, dates, rooming, and booking logic.',
            'Generate instant quotes with validated totals before sharing a price with a customer or partner.',
            'Work faster with a clean, focused interface built for accurate pricing rather than setup complexity.',
        ],
    },
] as const;

const footerLinks = [
    { key: 'landing.nav.overview', defaultLabel: 'Overview', href: '#platform' },
    { key: 'landing.nav.features', defaultLabel: 'Features', href: '#features' },
    { key: 'landing.nav.roles', defaultLabel: 'Roles', href: '#roles' },
    { key: 'landing.nav.control', defaultLabel: 'Control', href: '#security' },
] as const;

function surfaceTone(tone: 'navy' | 'mint' | 'light') {
    if (tone === 'navy') {
        return 'border-brand-navy/10 bg-brand-navy text-brand-light shadow-md dark:border-brand-light/10 dark:bg-brand-navy/80';
    }

    if (tone === 'mint') {
        return 'border-brand-mint/20 bg-brand-mint/10 text-brand-navy shadow-md dark:border-brand-mint/30 dark:bg-brand-navy/80 dark:text-brand-light';
    }

    return 'border-brand-light/70 bg-brand-light/78 text-brand-navy shadow-md dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light';
}

export default function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { t } = useTranslation('common');
    const { isDark, toggleTheme } = useTheme();

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 16);

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="landing-page min-h-screen overflow-x-clip bg-brand-light text-brand-navy dark:bg-brand-navy/80 dark:text-brand-light">
            <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[28rem] bg-brand-mint/10 dark:bg-brand-navy/80" />

            <header className="sticky top-0 z-50 px-4 pt-4 md:px-6">
                <div
                    className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-all duration-300 md:px-6 ${
                        isScrolled
                            ? 'border-brand-light/70 bg-brand-light/72 shadow-md backdrop-blur-2xl dark:border-brand-light/10 dark:bg-brand-navy/80'
                            : 'border-brand-light/55 bg-brand-light/54 backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-navy/80'
                    }`}
                >
                    <Link to="/" className="flex shrink-0 items-center gap-3" aria-label={t('auto.features.public.landingpage.aria-label.cb16b8d6', { defaultValue: "Pricify home" })}>
                        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/80 px-3 py-2 shadow-sm dark:border-brand-light/10 dark:bg-brand-navy/80">
                            <Logo />
                        </div>
                    </Link>

                    <nav className="hidden items-center justify-center gap-7 lg:flex">
                        {navItems.map((item) => (
                            <a
                                key={item.key}
                                href={item.href}
                                className="text-sm font-medium text-brand-slate transition hover:text-brand-navy dark:text-brand-light/75 dark:hover:text-brand-light"
                            >
                                {t(item.key, { defaultValue: item.defaultLabel })}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 md:gap-3">
                        <LanguageSwitcher compact className="shrink-0" />
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/80 text-brand-slate shadow-sm transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light/75 dark:hover:text-brand-light"
                            aria-label={t('actions.toggleTheme', { defaultValue: 'Toggle theme' })}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <Link
                            to="/login"
                            className="hidden min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-brand-navy transition hover:bg-brand-light/60 dark:text-brand-light dark:hover:bg-brand-navy/80 md:inline-flex"
                        >
                            {t('landing.actions.login', { defaultValue: 'Log in' })}
                        </Link>
                        <Link
                            to="/plans"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint md:px-5"
                        >
                            {t('landing.actions.getStarted', { defaultValue: 'Get Started' })}
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10">
                <section className="px-4 pb-16 pt-8 md:px-6 md:pb-20 md:pt-10 lg:pt-8">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:min-h-[85vh] lg:flex-row lg:items-center lg:gap-12">
                        <div className="flex w-full flex-col justify-center lg:w-1/2 lg:pr-4">
                            <div className="premium-pill w-fit border-brand-mint/20 bg-brand-mint/8 text-brand-mint">
                                <Blocks size={14} />
                                {t('landing.hero.badge', { defaultValue: 'Built for hotel commercial operations' })}
                            </div>

                            <h1 className="mt-5 max-w-[11ch] text-[clamp(2.85rem,5.5vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-brand-navy">
                                {t('landing.hero.title', { defaultValue: 'Hotel contracting, finally under control.' })}
                            </h1>

                            <p className="mt-5 max-w-2xl text-base leading-8 text-brand-slate md:text-lg">
                                {t('landing.hero.subtitle', { defaultValue: 'Give directors, contracting teams, and front-desk agents one workspace to manage contracts, pricing rules, partners, and quotes with clarity.' })}
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                {heroPills.map((item) => (
                                    <span
                                        key={item.key}
                                        className="inline-flex items-center rounded-full border border-brand-light/70 bg-brand-light/82 px-4 py-2 text-sm font-medium text-brand-slate shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light"
                                    >
                                        {t(item.key, { defaultValue: item.defaultLabel })}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    to="/plans"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 text-base font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-navy"
                                >
                                    {t('landing.actions.getStarted', { defaultValue: 'Get Started' })}
                                    <ArrowRight size={18} />
                                </Link>
                                <a
                                    href="#features"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-brand-navy/10 bg-brand-light/76 px-6 text-base font-semibold text-brand-navy backdrop-blur-xl transition hover:bg-brand-light dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light dark:hover:bg-brand-navy/80"
                                >
                                    {t('landing.hero.explore', { defaultValue: 'Explore the product surface' })}
                                </a>
                            </div>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-brand-mint/15 bg-brand-mint/8 px-4 py-2 text-sm font-semibold text-brand-navy dark:border-brand-mint/25 dark:bg-brand-mint/15 dark:text-brand-light">
                                    <BadgeCheck size={16} className="text-brand-mint" />
                                    {t('landing.hero.validatedQuote', { defaultValue: 'Every quote validated before it goes out' })}
                                </div>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                {heroHighlights.map((item) => (
                                    <div
                                        key={item.key}
                                        className="rounded-2xl border border-brand-light/70 bg-brand-light/78 px-4 py-4 shadow-md backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-navy/80"
                                    >
                                        <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">{t(item.key, { defaultValue: item.defaultLabel })}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative w-full lg:w-1/2">
                            <div className="absolute inset-0 rounded-2xl bg-brand-mint/10 blur-2xl dark:bg-brand-navy/80" />

                            <div className="premium-surface relative overflow-hidden p-4 sm:p-5 lg:max-h-[42rem]">
                                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-mint/14 blur-3xl" />
                                <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-brand-navy/8 blur-3xl" />

                                <div className="relative grid gap-4">
                                    <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy p-5 text-brand-light shadow-md">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                                    Commercial workspace
                                                </p>
                                                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                                                    Hotel contracting in one clear workspace.
                                                </h2>
                                                <p className="mt-3 max-w-xl text-sm leading-7 text-brand-slate">
                                                    A calmer workflow for hotel teams managing contracts, pricing,
                                                    partners, and quotes together.
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-brand-light/10 bg-brand-light/8 px-4 py-3">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-mint">
                                                    Core teams
                                                </p>
                                                <p className="mt-2 text-sm font-medium text-brand-light">
                                                    Directors / Contracting / Front-Desk
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 md:grid-cols-[0.92fr,1.08fr]">
                                            <div className="rounded-2xl border border-brand-light/10 bg-brand-light/[0.05] p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                                            Executive view
                                                        </p>
                                                        <p className="mt-2 text-lg font-semibold text-brand-light">
                                                            Multi-property oversight
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl bg-brand-mint/14 p-3 text-brand-mint">
                                                        <Globe2 size={18} />
                                                    </div>
                                                </div>

                                                <div className="mt-4 space-y-3">
                                                    {[
                                                        ['Hotel portfolio', 'One view across properties'],
                                                        ['Team control', 'Clear roles and access'],
                                                    ].map(([value, label]) => (
                                                        <div
                                                            key={value}
                                                            className="rounded-2xl border border-brand-light/8 bg-brand-light/[0.06] px-4 py-3"
                                                        >
                                                            <p className="text-lg font-semibold text-brand-light">{value}</p>
                                                            <p className="mt-1 text-xs leading-6 text-brand-slate">{label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-brand-light/10 bg-brand-mint/10 p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate">
                                                            Operational workspace
                                                        </p>
                                                        <p className="mt-2 text-lg font-semibold text-brand-light">
                                                            Contract-ready operations
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl bg-brand-light/10 p-3 text-brand-mint">
                                                        <BriefcaseBusiness size={18} />
                                                    </div>
                                                </div>

                                                <div className="mt-4 space-y-3">
                                                    {[
                                                        ['Contract setup', 'Rates, SPOs, supplements, and conditions'],
                                                        ['Quote validation', 'Fast simulation with final totals'],
                                                    ].map(([title, copy]) => (
                                                        <div
                                                            key={title}
                                                            className="rounded-2xl border border-brand-light/8 bg-brand-navy/30 px-4 py-3"
                                                        >
                                                            <p className="text-sm font-semibold text-brand-light">{title}</p>
                                                            <p className="mt-1 text-xs leading-6 text-brand-slate">{copy}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-[1.05fr,0.95fr]">
                                        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/82 p-4 shadow-md backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-navy/80">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate dark:text-brand-light/75">
                                                        Contract engine
                                                    </p>
                                                    <h3 className="mt-2 text-lg font-semibold text-brand-navy dark:text-brand-light">
                                                        Every pricing rule stays connected.
                                                    </h3>
                                                </div>
                                                <div className="rounded-2xl bg-brand-navy/8 p-3 text-brand-navy dark:bg-brand-light/10 dark:text-brand-mint">
                                                    <FileStack size={18} />
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                {[
                                                    'Rate grids',
                                                    'SPOs and supplements',
                                                    'Booking and cancellation rules',
                                                ].map((item) => (
                                                    <div
                                                        key={item}
                                                        className="rounded-2xl border border-brand-navy/8 bg-brand-light px-4 py-3 text-sm font-medium text-brand-slate dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light"
                                                    >
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-brand-mint/20 bg-brand-mint/10 p-4 shadow-md dark:border-brand-mint/30 dark:bg-brand-navy/80">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-mint">
                                                        Simulator
                                                    </p>
                                                    <h3 className="mt-2 text-lg font-semibold text-brand-navy dark:text-brand-light">
                                                        Quote with confidence.
                                                    </h3>
                                                </div>
                                                <div className="rounded-2xl bg-brand-light/70 p-3 text-brand-mint dark:bg-brand-light/10">
                                                    <Calculator size={18} />
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                {[
                                                    ['Contract checked', 'The right commercial terms are applied'],
                                                    ['Final price ready', 'Validated before sharing the quote'],
                                                ].map(([title, value]) => (
                                                    <div
                                                        key={title}
                                                        className="flex items-start justify-between gap-4 rounded-2xl border border-brand-light/70 bg-brand-light/76 px-4 py-3 dark:border-brand-light/10 dark:bg-brand-navy/80"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">{title}</p>
                                                            <p className="mt-1 text-xs leading-6 text-brand-slate dark:text-brand-light/75">{value}</p>
                                                        </div>
                                                        <CheckCircle2 size={18} className="mt-1 shrink-0 text-brand-mint" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-brand-light/60 bg-brand-light/42 px-4 py-4 backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-navy/80 md:px-6">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="premium-pill border-brand-navy/10 bg-brand-light/70 text-brand-slate dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light/75">
                                {t('landing.trust.badge', { defaultValue: 'Built for modern hospitality operations' })}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold uppercase tracking-[0.22em] text-brand-slate/80 dark:text-brand-light/75">
                            {trustItems.map((item) => (
                                <span key={item.key}>{t(item.key, { defaultValue: item.defaultLabel })}</span>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="platform" className="px-4 py-18 md:px-6 md:py-22">
                    <div className="mx-auto max-w-7xl">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                {t('landing.platform.eyebrow', { defaultValue: 'Public value proposition' })}
                            </p>
                            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-brand-navy md:text-5xl">
                                {t('landing.platform.title', { defaultValue: 'Pricify helps hotels centralize contracting, pricing, and quoting.' })}
                            </h2>
                            <p className="mt-5 text-base leading-8 text-brand-slate md:text-lg">
                                {t('landing.platform.subtitle', { defaultValue: 'The product story is simple for customers: manage every hotel, every contract rule, every B2B partner, and every quote from one connected commercial workspace.' })}
                            </p>
                        </div>

                        <div className="mt-10 grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    title: 'Multi-property control',
                                    copy: 'Directors can oversee hotels, teams, and commercial structure from a single operational workspace.',
                                    icon: LockKeyhole,
                                },
                                {
                                    title: 'Deep contract engine',
                                    copy: 'Contracting teams manage a full B2B pricing engine spanning rate grids, SPOs, supplements, reductions, early booking, and cancellation rules.',
                                    icon: Workflow,
                                },
                                {
                                    title: 'Instant quote accuracy',
                                    copy: 'Front-desk agents can simulate contract-aware totals before releasing a quote, reducing risk, delays, and rework.',
                                    icon: Calculator,
                                },
                            ].map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <article key={item.title} className="premium-surface p-6">
                                        <div className="inline-flex rounded-2xl bg-brand-mint/10 p-3 text-brand-mint">
                                            <Icon size={20} />
                                        </div>
                                        <h3 className="mt-5 text-2xl font-semibold tracking-tight text-brand-navy">
                                            {t(`landing.platform.cards.${index}.title`, { defaultValue: item.title })}
                                        </h3>
                                        <p className="mt-3 text-sm leading-7 text-brand-slate">
                                            {t(`landing.platform.cards.${index}.copy`, { defaultValue: item.copy })}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="features" className="px-4 py-18 md:px-6 md:py-22">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                    {t('landing.features.eyebrow', { defaultValue: 'Features bento' })}
                                </p>
                                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-brand-navy md:text-5xl">
                                    {t('landing.features.title', { defaultValue: 'Everything the platform does is reflected in the first story your buyers see.' })}
                                </h2>
                            </div>

                            <div className="rounded-2xl border border-brand-mint/15 bg-brand-mint/8 px-5 py-4 text-sm leading-7 text-brand-navy dark:border-brand-mint/25 dark:bg-brand-mint/12 dark:text-brand-light">
                                {t('landing.features.subtitle', { defaultValue: 'From hotel setup to partner contracts and instant simulation, every section below translates the product into customer-facing operational value.' })}
                            </div>
                        </div>

                        <div className="mt-10 grid gap-4 xl:grid-cols-7">
                            {bentoCards.map((card, cardIndex) => {
                                const Icon = card.icon;
                                const darkTone = card.tone === 'navy';

                                return (
                                    <article
                                        key={card.title}
                                        className={`rounded-2xl border p-6 backdrop-blur-xl ${card.className} ${surfaceTone(card.tone)}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className={`inline-flex rounded-2xl p-3 ${darkTone ? 'bg-brand-light/10 text-brand-mint' : 'bg-brand-navy/8 text-brand-mint'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <span
                                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                                    darkTone
                                                        ? 'bg-brand-light/10 text-brand-slate'
                                                        : 'border border-brand-navy/10 bg-brand-light/70 text-brand-slate dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light/75'
                                                }`}
                                            >
                                                {t('landing.bento.badge', { defaultValue: 'Hotel value' })}
                                            </span>
                                        </div>

                                        <h3 className={`mt-6 text-2xl font-semibold tracking-tight ${darkTone ? 'text-brand-light' : 'text-brand-navy'}`}>
                                            {t(`landing.bento.cards.${cardIndex}.title`, { defaultValue: card.title })}
                                        </h3>
                                        <p className={`mt-3 text-sm leading-7 ${darkTone ? 'text-brand-slate' : 'text-brand-slate'}`}>
                                            {t(`landing.bento.cards.${cardIndex}.description`, { defaultValue: card.description })}
                                        </p>

                                        <div className="mt-5 space-y-3">
                                            {card.bullets.map((bullet, bulletIndex) => (
                                                <div
                                                    key={bullet}
                                                    className={`rounded-2xl px-4 py-3 text-sm ${
                                                        darkTone
                                                            ? 'bg-brand-light/[0.06] text-brand-slate'
                                                            : 'border border-brand-navy/8 bg-brand-light/64 text-brand-navy dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light'
                                                    }`}
                                                >
                                                    {t(`landing.bento.cards.${cardIndex}.bullets.${bulletIndex}`, { defaultValue: bullet })}
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="roles" className="bg-brand-light/50 px-4 py-18 backdrop-blur-xl dark:bg-brand-navy/80 md:px-6 md:py-22">
                    <div className="mx-auto max-w-7xl">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                {t('landing.roles.eyebrow', { defaultValue: 'Role-based value' })}
                            </p>
                            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-brand-navy md:text-5xl">
                                {t('landing.roles.title', { defaultValue: 'Every hotel team gets the workspace they actually need.' })}
                            </h2>
                            <p className="mt-5 text-base leading-8 text-brand-slate md:text-lg">
                                {t('landing.roles.subtitle', { defaultValue: 'Directors, contracting teams, and front-desk staff all work differently. Pricify keeps each role fast, clear, and aligned around the same commercial truth.' })}
                            </p>
                        </div>

                        <div className="mt-10 grid gap-4 md:grid-cols-3">
                            {roleCards.map((card, roleIndex) => {
                                const Icon = card.icon;

                                return (
                                    <article key={card.title} className="premium-surface h-full p-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-mint">
                                                    {t(`landing.roles.cards.${roleIndex}.title`, { defaultValue: card.title })}
                                                </p>
                                                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-brand-navy">
                                                    {t(`landing.roles.cards.${roleIndex}.subtitle`, { defaultValue: card.subtitle })}
                                                </h3>
                                            </div>
                                            <div className="rounded-2xl bg-brand-navy/8 p-3 text-brand-mint">
                                                <Icon size={20} />
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            {card.points.map((point, pointIndex) => (
                                                <div
                                                    key={point}
                                                    className="rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-4 text-sm leading-7 text-brand-slate dark:border-brand-light/10 dark:bg-brand-navy/80 dark:text-brand-light/75"
                                                >
                                                    {t(`landing.roles.cards.${roleIndex}.points.${pointIndex}`, { defaultValue: point })}
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="security" className="px-4 py-18 md:px-6 md:py-22">
                    <div className="mx-auto max-w-7xl">
                        <div className="premium-surface overflow-hidden p-6 md:p-8">
                            <div className="grid gap-8 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                        {t('landing.security.eyebrow', { defaultValue: 'Operational control' })}
                                    </p>
                                    <h2 className="mt-4 text-4xl font-semibold tracking-tight text-brand-navy md:text-5xl">
                                        {t('landing.security.title', { defaultValue: 'Control grows with your hotel group, not against it.' })}
                                    </h2>
                                    <p className="mt-5 text-base leading-8 text-brand-slate md:text-lg">
                                        {t('landing.security.subtitle', { defaultValue: 'As your team, portfolio, and partner network expand, Pricify keeps access, visibility, and pricing logic organized so operations stay consistent across every hotel.' })}
                                    </p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    {[
                                        {
                                            title: 'Access control',
                                            icon: ShieldCheck,
                                            copy: 'Give each team member the right workspace so directors, contracting users, and front-desk staff stay focused.',
                                        },
                                        {
                                            title: 'Multi-property visibility',
                                            icon: Building2,
                                            copy: 'Manage several hotels with a clearer operational structure and a centralized view of your commercial environment.',
                                        },
                                        {
                                            title: 'Reliable pricing execution',
                                            icon: CircleDollarSign,
                                            copy: 'Keep contracts, partner terms, and simulated prices aligned so every quote reflects the rules you actually negotiated.',
                                        },
                                    ].map((item, index) => {
                                        const Icon = item.icon;

                                        return (
                                            <article key={item.title} className="rounded-2xl border border-brand-light/70 bg-brand-light/78 p-5 shadow-sm dark:border-brand-light/10 dark:bg-brand-navy/80">
                                                <div className="inline-flex rounded-2xl bg-brand-mint/10 p-3 text-brand-mint">
                                                    <Icon size={18} />
                                                </div>
                                                <h3 className="mt-4 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                                    {t(`landing.security.cards.${index}.title`, { defaultValue: item.title })}
                                                </h3>
                                                <p className="mt-3 text-sm leading-7 text-brand-slate dark:text-brand-light/75">
                                                    {t(`landing.security.cards.${index}.copy`, { defaultValue: item.copy })}
                                                </p>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="cta" className="px-4 pb-24 pt-6 md:px-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="relative overflow-hidden rounded-2xl border border-brand-navy/10 bg-brand-navy px-6 py-10 text-brand-light shadow-md md:px-10 md:py-14">
                            <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-brand-mint/18 blur-3xl" />
                            <div className="absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-brand-light/8 blur-3xl" />

                            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                                        {t('landing.cta.eyebrow', { defaultValue: 'Final CTA' })}
                                    </p>
                                    <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                                        {t('landing.cta.title', { defaultValue: 'Ready to upgrade your hotel contracting?' })}
                                    </h2>
                                    <p className="mt-5 text-base leading-8 text-brand-slate md:text-lg">
                                        {t('landing.cta.subtitle', { defaultValue: 'Replace spreadsheet-heavy contracting, pricing errors, and fragmented partner coordination with one commercial workspace built for fast-moving hospitality teams.' })}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        to="/login"
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-6 text-base font-semibold text-brand-light transition hover:bg-brand-mint"
                                    >
                                        {t('landing.actions.signIn', { defaultValue: 'Sign in' })}
                                        <ArrowRight size={18} />
                                    </Link>
                                    <a
                                        href="#platform"
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-brand-light/12 bg-brand-light/6 px-6 text-base font-semibold text-brand-light transition hover:bg-brand-light/10"
                                    >
                                        {t('landing.cta.reviewWorkflow', { defaultValue: 'Review the hotel workflow' })}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-brand-light/60 bg-brand-light/62 px-4 py-10 backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-navy/80 md:px-6">
                    <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-md">
                            <div className="inline-flex rounded-2xl border border-brand-light/70 bg-brand-light/82 px-3 py-2 shadow-sm dark:border-brand-light/10 dark:bg-brand-navy/80">
                                <Logo />
                            </div>
                            <p className="mt-4 text-sm leading-7 text-brand-slate">
                            {t('landing.footer.subtitle', { defaultValue: 'Pricify connects multi-property control, hotel contracting, partner management, and zero-risk price validation in one modern hospitality workspace.' })}
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 md:items-end">
                        <div className="flex flex-wrap gap-4 text-sm font-medium text-brand-slate">
                            {footerLinks.map((item) => (
                                <a key={item.key} href={item.href} className="transition hover:text-brand-navy dark:hover:text-brand-light">
                                    {t(item.key, { defaultValue: item.defaultLabel })}
                                </a>
                            ))}
                        </div>
                        <p className="text-sm text-brand-slate">
                            © {new Date().getFullYear()} Pricify. Hotel contracting, partner pricing, and instant quote control.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
