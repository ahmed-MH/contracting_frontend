import { Activity, Building2, CircleDollarSign, Shield } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import {
    temporaryPlatformPulse,
    temporarySupervisorOverviewMetrics,
} from '../data/supervisor.data';
import {
    useSupervisorSubscriptions,
    useSupervisorSubscriptionSummary,
    type SupervisorSubscription,
} from '../hooks/useSupervisor';

const overviewIcons = [CircleDollarSign, Building2, Shield, Activity] as const;

interface SubscriptionWatchRow {
    organization: string;
    plan: string;
    mrr: string;
    renewalDate: string;
    status: string;
}

function formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function statusLabel(status: SupervisorSubscription['status']): string {
    if (status === 'ACTIVE') return 'Healthy';
    if (status === 'PAST_DUE') return 'Overdue';
    return 'Suspended';
}

function LoadingPanel() {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/45 p-6 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
            Loading supervisor subscription data...
        </div>
    );
}

function ErrorPanel({ label }: { label: string }) {
    return (
        <div className="rounded-2xl border border-brand-slate/25 bg-brand-slate/10 p-6 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
            {label}
        </div>
    );
}

export default function SupervisorOverviewPage() {
    const { t } = useTranslation('common');
    const summaryQuery = useSupervisorSubscriptionSummary();
    const subscriptionsQuery = useSupervisorSubscriptions();

    const subscriptions = subscriptionsQuery.data ?? [];
    const subscriptionWatchRows = useMemo<SubscriptionWatchRow[]>(() => {
        if (subscriptions.length === 0) {
            return [];
        }

        return [...subscriptions]
            .sort((left, right) => {
                const leftRisk = left.status === 'ACTIVE' ? 1 : 0;
                const rightRisk = right.status === 'ACTIVE' ? 1 : 0;
                return leftRisk - rightRisk;
            })
            .map((subscription) => ({
                organization: subscription.organizationName,
                plan: subscription.planName,
                mrr: formatMoney(subscription.monthlyRecurringRevenue, subscription.currency),
                renewalDate: subscription.renewalDate,
                status: statusLabel(subscription.status),
            }));
    }, [subscriptions]);

    const mrrSegments = useMemo(() => {
        if (subscriptions.length === 0) {
            return [];
        }

        const totalMrr = subscriptions.reduce((total, subscription) => total + subscription.monthlyRecurringRevenue, 0);
        const byPlan = subscriptions.reduce<Record<string, { mrr: number; count: number; currency: string }>>((acc, subscription) => {
            const existing = acc[subscription.planName] ?? { mrr: 0, count: 0, currency: subscription.currency };
            acc[subscription.planName] = {
                mrr: existing.mrr + subscription.monthlyRecurringRevenue,
                count: existing.count + 1,
                currency: subscription.currency,
            };
            return acc;
        }, {});

        return Object.entries(byPlan).map(([name, segment]) => ({
            name,
            share: totalMrr > 0 ? `${Math.round((segment.mrr / totalMrr) * 100)}%` : '0%',
            mrr: formatMoney(segment.mrr, segment.currency),
            detail: `${segment.count} subscription${segment.count === 1 ? '' : 's'} currently mapped to this plan.`,
        }));
    }, [subscriptions]);

    const summary = summaryQuery.data;
    const metrics = [
        {
            label: temporarySupervisorOverviewMetrics[0].label,
            value: summary ? formatMoney(summary.monthlyRecurringRevenue, summary.currency) : temporarySupervisorOverviewMetrics[0].value,
            delta: summary
                ? `${formatMoney(summary.atRiskMonthlyRecurringRevenue, summary.currency)} at risk`
                : temporarySupervisorOverviewMetrics[0].delta,
            description: temporarySupervisorOverviewMetrics[0].description,
        },
        {
            label: temporarySupervisorOverviewMetrics[1].label,
            value: summary ? String(summary.activeSubscriptions) : temporarySupervisorOverviewMetrics[1].value,
            delta: summary ? `${summary.totalSubscriptions} total subscriptions` : temporarySupervisorOverviewMetrics[1].delta,
            description: 'Active subscription records returned by the supervisor subscriptions API.',
        },
        {
            label: temporarySupervisorOverviewMetrics[2].label,
            value: summary ? String(summary.pastDueSubscriptions + summary.suspendedSubscriptions) : temporarySupervisorOverviewMetrics[2].value,
            delta: summary ? `${summary.pastDueSubscriptions} past due / ${summary.suspendedSubscriptions} suspended` : temporarySupervisorOverviewMetrics[2].delta,
            description: temporarySupervisorOverviewMetrics[2].description,
        },
        temporarySupervisorOverviewMetrics[3],
    ];

    const watchlistColumns: SupervisorTableColumn<SubscriptionWatchRow>[] = [
        {
            key: 'organization',
            label: 'Organization',
            render: (row) => (
                <div>
                    <p className="font-semibold text-brand-navy dark:text-brand-light">{row.organization}</p>
                    <p className="mt-1 text-xs text-brand-slate">Plan {row.plan}</p>
                </div>
            ),
        },
        {
            key: 'mrr',
            label: 'MRR',
            render: (row) => <span className="font-semibold text-brand-navy dark:text-brand-light">{row.mrr}</span>,
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

    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.overview.header.eyebrow', { defaultValue: 'Overview / MRR' })}
                title={t('pages.supervisor.overview.header.title', { defaultValue: 'Platform command center for revenue and tenant health.' })}
                description={t('pages.supervisor.overview.header.description', { defaultValue: 'This dashboard stays above the tenant privacy line: subscription performance, organization status, and supervisor-safe platform signals only.' })}
                badge={t('pages.supervisor.overview.header.badge', { defaultValue: 'Zero-trust supervisor surface' })}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric, index) => (
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

            {(summaryQuery.isLoading || subscriptionsQuery.isLoading) && <LoadingPanel />}
            {(summaryQuery.isError || subscriptionsQuery.isError) && (
                <ErrorPanel label="Unable to load live supervisor subscription data. Temporary fallback sections remain visible below." />
            )}

            <section className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.overview.cards.mrrComposition.eyebrow', { defaultValue: 'MRR Composition' })}
                    title={t('pages.supervisor.overview.cards.mrrComposition.title', { defaultValue: 'Revenue mix by plan tier' })}
                    description={t('pages.supervisor.overview.cards.mrrComposition.description', { defaultValue: 'A high-level read on where recurring revenue is concentrated across the platform.' })}
                >
                    {mrrSegments.length === 0 ? (
                        <ErrorPanel label="No subscription MRR is available yet." />
                    ) : (
                        <div className="space-y-4">
                            {mrrSegments.map((segment, index) => (
                                <div key={segment.name} className="rounded-2xl border border-brand-light/70 bg-brand-light/72 p-5 dark:border-brand-light/10 dark:bg-brand-light/5">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-lg font-semibold text-brand-navy dark:text-brand-light">
                                                {t(`pages.supervisor.overview.cards.mrrComposition.segments.${index}.name`, { defaultValue: segment.name })}
                                            </p>
                                            <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/75">
                                                {t(`pages.supervisor.overview.cards.mrrComposition.segments.${index}.detail`, { defaultValue: segment.detail })}
                                            </p>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <p className="text-2xl font-semibold text-brand-navy dark:text-brand-light">{segment.mrr}</p>
                                            <p className="text-sm text-brand-mint">
                                                {t('pages.supervisor.overview.cards.mrrComposition.ofMrr', { defaultValue: '{{share}} of platform MRR', share: segment.share })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SupervisorSectionCard>

                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.overview.cards.executivePulse.eyebrow', { defaultValue: 'Executive Pulse' })}
                    title={t('pages.supervisor.overview.cards.executivePulse.title', { defaultValue: 'Governance-safe status feed' })}
                    description={t('pages.supervisor.overview.cards.executivePulse.description', { defaultValue: 'Signals that matter for supervisors without exposing contracts, rooms, catalogs, or simulators.' })}
                >
                    <div className="rounded-2xl bg-brand-navy px-5 py-5 text-brand-light">
                        <p className="text-sm text-brand-slate">
                            {t('pages.supervisor.overview.cards.executivePulse.readinessLabel', { defaultValue: 'Platform readiness' })}
                        </p>
                        <p className="mt-2 text-4xl font-semibold tracking-tight">92%</p>
                        <p className="mt-3 text-sm text-brand-slate">
                            {t('pages.supervisor.overview.cards.executivePulse.readinessDescription', { defaultValue: 'Composite score across billing, audit retention, tenant onboarding, and incident recovery.' })}
                        </p>
                    </div>

                    <div className="mt-4 space-y-3">
                        {temporaryPlatformPulse.map((item, index) => (
                            <div key={item} className="rounded-2xl border border-brand-mint/15 bg-brand-mint/8 px-4 py-3 text-sm text-brand-navy dark:text-brand-light">
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
                {subscriptionsQuery.isLoading ? (
                    <LoadingPanel />
                ) : subscriptionsQuery.isError ? (
                    <ErrorPanel label="Unable to load live supervisor subscriptions from the API right now." />
                ) : subscriptionWatchRows.length === 0 ? (
                    <ErrorPanel label="No subscriptions are available from the supervisor API yet." />
                ) : (
                    <SupervisorDataTable
                        columns={watchlistColumns}
                        rows={subscriptionWatchRows}
                        rowKey={(row) => row.organization}
                    />
                )}
            </SupervisorSectionCard>
        </div>
    );
}
