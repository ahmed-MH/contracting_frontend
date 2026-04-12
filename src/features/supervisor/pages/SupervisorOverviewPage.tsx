import { Activity, Building2, CircleDollarSign, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import {
    mrrSegments,
    platformPulse,
    subscriptionWatchlist,
    supervisorOverviewMetrics,
} from '../data/supervisor.data';

const overviewIcons = [CircleDollarSign, Building2, Shield, Activity] as const;

const watchlistColumns: SupervisorTableColumn<(typeof subscriptionWatchlist)[number]>[] = [
    {
        key: 'organization',
        label: 'Organization',
        render: (row) => (
            <div>
                <p className="font-semibold text-brand-navy dark:text-white">{row.organization}</p>
                <p className="mt-1 text-xs text-brand-slate">Plan {row.plan}</p>
            </div>
        ),
    },
    {
        key: 'mrr',
        label: 'MRR',
        render: (row) => <span className="font-semibold text-brand-navy dark:text-white">{row.mrr}</span>,
    },
    {
        key: 'renewalDate',
        label: 'Renewal',
        render: (row) => <span className="text-brand-slate dark:text-brand-light/75">{row.renewalDate}</span>,
    },
    {
        key: 'status',
        label: 'Status',
        render: (row) => (
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                row.status === 'Healthy'
                    ? 'bg-brand-mint/10 text-brand-mint'
                    : 'bg-brand-slate/10 text-brand-slate'
            }`}>
                {row.status}
            </span>
        ),
    },
];

export default function SupervisorOverviewPage() {
    const { t } = useTranslation('common');
    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.overview.header.eyebrow', { defaultValue: 'Overview / MRR' })}
                title={t('pages.supervisor.overview.header.title', { defaultValue: 'Platform command center for revenue and tenant health.' })}
                description={t('pages.supervisor.overview.header.description', { defaultValue: 'This dashboard stays above the tenant privacy line: subscription performance, organization status, and supervisor-safe platform signals only.' })}
                badge={t('pages.supervisor.overview.header.badge', { defaultValue: 'Zero-trust supervisor surface' })}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {supervisorOverviewMetrics.map((metric, index) => (
                    <SupervisorMetricCard
                        key={metric.label}
                        label={t(`pages.supervisor.overview.metrics.${index}.label`, { defaultValue: metric.label })}
                        value={metric.value}
                        delta={t(`pages.supervisor.overview.metrics.${index}.delta`, { defaultValue: metric.delta })}
                        description={t(`pages.supervisor.overview.metrics.${index}.description`, { defaultValue: metric.description })}
                        icon={overviewIcons[index]}
                        tone={index === 2 ? 'amber' : 'mint'}
                    />
                ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.overview.cards.mrrComposition.eyebrow', { defaultValue: 'MRR Composition' })}
                    title={t('pages.supervisor.overview.cards.mrrComposition.title', { defaultValue: 'Revenue mix by plan tier' })}
                    description={t('pages.supervisor.overview.cards.mrrComposition.description', { defaultValue: 'A high-level read on where recurring revenue is concentrated across the platform.' })}
                >
                    <div className="space-y-4">
                        {mrrSegments.map((segment, index) => (
                            <div key={segment.name} className="rounded-2xl border border-white/70 bg-white/72 p-5 dark:border-white/10 dark:bg-white/5">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-brand-navy dark:text-white">
                                            {t(`pages.supervisor.overview.cards.mrrComposition.segments.${index}.name`, { defaultValue: segment.name })}
                                        </p>
                                        <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/75">
                                            {t(`pages.supervisor.overview.cards.mrrComposition.segments.${index}.detail`, { defaultValue: segment.detail })}
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-2xl font-semibold text-brand-navy dark:text-white">{segment.mrr}</p>
                                        <p className="text-sm text-brand-mint">
                                            {t('pages.supervisor.overview.cards.mrrComposition.ofMrr', { defaultValue: '{{share}} of platform MRR', share: segment.share })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SupervisorSectionCard>

                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.overview.cards.executivePulse.eyebrow', { defaultValue: 'Executive Pulse' })}
                    title={t('pages.supervisor.overview.cards.executivePulse.title', { defaultValue: 'Governance-safe status feed' })}
                    description={t('pages.supervisor.overview.cards.executivePulse.description', { defaultValue: 'Signals that matter for supervisors without exposing contracts, rooms, catalogs, or simulators.' })}
                >
                    <div className="rounded-2xl bg-brand-navy px-5 py-5 text-white">
                        <p className="text-sm text-brand-slate">
                            {t('pages.supervisor.overview.cards.executivePulse.readinessLabel', { defaultValue: 'Platform readiness' })}
                        </p>
                        <p className="mt-2 text-4xl font-semibold tracking-tight">92%</p>
                        <p className="mt-3 text-sm text-brand-slate">
                            {t('pages.supervisor.overview.cards.executivePulse.readinessDescription', { defaultValue: 'Composite score across billing, audit retention, tenant onboarding, and incident recovery.' })}
                        </p>
                    </div>

                    <div className="mt-4 space-y-3">
                        {platformPulse.map((item, index) => (
                            <div key={item} className="rounded-2xl border border-brand-mint/15 bg-brand-mint/8 px-4 py-3 text-sm text-brand-navy dark:text-white">
                                {t(`pages.supervisor.overview.cards.executivePulse.items.${index}`, { defaultValue: item })}
                            </div>
                        ))}
                    </div>
                </SupervisorSectionCard>
            </section>

            <SupervisorSectionCard
                eyebrow={t('pages.supervisor.overview.cards.subscriptionWatch.eyebrow', { defaultValue: 'Subscription Watch' })}
                title={t('pages.supervisor.overview.cards.subscriptionWatch.title', { defaultValue: 'Accounts needing supervisor attention' })}
                description={t('pages.supervisor.overview.cards.subscriptionWatch.description', { defaultValue: 'Billing-centric follow-up queue for organizations approaching suspension or renewal risk.' })}
            >
                <SupervisorDataTable
                    columns={watchlistColumns}
                    rows={[...subscriptionWatchlist]}
                    rowKey={(row) => row.organization}
                />
            </SupervisorSectionCard>
        </div>
    );
}
