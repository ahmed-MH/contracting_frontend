import { Activity, Building2, CircleDollarSign, Shield } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import {
    useSupervisorPlans,
    useSupervisorPublicSignups,
    useSupervisorSubscriptions,
    useSupervisorSubscriptionSummary,
    useSupervisorTenants,
    type SupervisorSubscription,
} from '../hooks/useSupervisor';

const overviewIcons = [CircleDollarSign, Building2, Shield, Activity] as const;

interface SubscriptionWatchRow {
    organization: string;
    plan: string;
    recurringMrr: string;
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
        <div className="rounded-2xl border border-brand-slate/15 bg-white/65 p-6 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
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
    const tenantsQuery = useSupervisorTenants();
    const plansQuery = useSupervisorPlans();
    const publicSignupsQuery = useSupervisorPublicSignups({ limit: 50 });

    const subscriptions = subscriptionsQuery.data ?? [];
    const tenants = tenantsQuery.data ?? [];
    const plans = plansQuery.data ?? [];
    const publicSignups = publicSignupsQuery.data ?? [];
    const activeTenants = tenants.filter((tenant) => tenant.isActive).length;
    const suspendedTenants = tenants.length - activeTenants;
    const activePlans = plans.filter((plan) => plan.isActive).length;
    const pendingPublicSignups = publicSignups.filter((signup) => signup.status === 'PENDING_PAYMENT' || signup.status === 'PAID').length;
    const completedPublicSignups = publicSignups.filter((signup) => signup.status === 'COMPLETED').length;
    const failedPublicSignups = publicSignups.filter((signup) => signup.status === 'FAILED' || signup.status === 'EXPIRED').length;
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
                recurringMrr: formatMoney(subscription.monthlyRecurringRevenue, subscription.currency),
                renewalDate: subscription.renewalDate,
                status: statusLabel(subscription.status),
            }));
    }, [subscriptions]);

    const mrrSegments = useMemo(() => {
        if (subscriptions.length === 0) {
            return [];
        }

        const recurringSubscriptions = subscriptions.filter((subscription) => subscription.monthlyRecurringRevenue > 0);
        const totalMrr = recurringSubscriptions.reduce((total, subscription) => total + subscription.monthlyRecurringRevenue, 0);
        const byPlan = recurringSubscriptions.reduce<Record<string, { mrr: number; count: number; currency: string }>>((acc, subscription) => {
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
            label: 'Recurring MRR',
            value: summary ? formatMoney(summary.monthlyRecurringRevenue, summary.currency) : '...',
            delta: summary
                ? `${formatMoney(summary.atRiskMonthlyRecurringRevenue, summary.currency)} at risk`
                : 'Loading live billing summary',
            description: 'Active recurring subscriptions only. One-time plan payments are excluded from MRR.',
        },
        {
            label: 'Active Organizations',
            value: tenantsQuery.isLoading ? '...' : String(activeTenants),
            delta: tenantsQuery.isError ? 'Tenant API unavailable' : `${tenants.length} total / ${suspendedTenants} suspended`,
            description: 'Live tenant count from the supervisor tenants API.',
        },
        {
            label: 'Billing Watchlist',
            value: summary ? String(summary.pastDueSubscriptions + summary.suspendedSubscriptions) : '...',
            delta: summary ? `${summary.pastDueSubscriptions} past due / ${summary.suspendedSubscriptions} suspended` : 'Loading live subscription summary',
            description: 'Subscription records that need billing or recovery attention.',
        },
        {
            label: 'Active Plans',
            value: plansQuery.isLoading ? '...' : String(activePlans),
            delta: plansQuery.isError ? 'Plans API unavailable' : `${plans.length} total plans configured`,
            description: 'Live plan count from the supervisor plans API.',
        },
    ];

    const watchlistColumns: SupervisorTableColumn<SubscriptionWatchRow>[] = [
        {
            key: 'organization',
            label: 'Organization',
            render: (row) => (
                <div>
                    <p className="font-semibold text-brand-navy dark:text-brand-light">{row.organization}</p>
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">Plan {row.plan}</p>
                </div>
            ),
        },
        {
            key: 'recurringMrr',
            label: 'Recurring MRR',
            render: (row) => <span className="font-semibold text-brand-navy dark:text-brand-light">{row.recurringMrr}</span>,
        },
        {
            key: 'renewalDate',
            label: 'Period end',
            render: (row) => <span className="text-brand-slate dark:text-brand-light/75">{row.renewalDate}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    row.status === 'Healthy'
                        ? 'border-brand-mint/20 bg-brand-mint/10 text-brand-mint'
                        : 'border-brand-slate/20 bg-brand-slate/8 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/10 dark:text-brand-light/75'
                }`}>
                    {row.status}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.overview.header.eyebrow', { defaultValue: 'Overview / Revenue' })}
                title={t('pages.supervisor.overview.header.title', { defaultValue: 'Platform command center for revenue and tenant health.' })}
                description={t('pages.supervisor.overview.header.description', { defaultValue: 'This dashboard stays above the tenant privacy line: subscription performance, organization status, and supervisor-safe platform signals only.' })}
                badge={t('pages.supervisor.overview.header.badge', { defaultValue: 'Zero-trust supervisor surface' })}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric, index) => (
                    <SupervisorMetricCard
                        key={metric.label}
                        label={metric.label}
                        value={metric.value}
                        delta={metric.delta}
                        description={metric.description}
                        icon={overviewIcons[index]}
                        tone={index === 2 ? 'amber' : 'mint'}
                    />
                ))}
            </section>

            {(summaryQuery.isLoading || subscriptionsQuery.isLoading || tenantsQuery.isLoading || plansQuery.isLoading) && <LoadingPanel />}
            {(summaryQuery.isError || subscriptionsQuery.isError || tenantsQuery.isError || plansQuery.isError) && (
                <ErrorPanel label="Some live supervisor APIs are unavailable. No static production-looking fallback numbers are shown." />
            )}

            <section className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.overview.cards.mrrComposition.eyebrow', { defaultValue: 'Recurring MRR Composition' })}
                    title={t('pages.supervisor.overview.cards.mrrComposition.title', { defaultValue: 'Revenue mix by plan tier' })}
                    description={t('pages.supervisor.overview.cards.mrrComposition.description', { defaultValue: 'A high-level read on where recurring revenue is concentrated across the platform.' })}
                >
                    {mrrSegments.length === 0 ? (
                        <ErrorPanel label="No recurring subscription MRR is available yet." />
                    ) : (
                        <div className="space-y-4">
                            {mrrSegments.map((segment, index) => (
                                <div key={segment.name} className="rounded-2xl border border-brand-slate/15 bg-white/70 p-5 dark:border-brand-light/10 dark:bg-brand-light/5">
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
                                                {t('pages.supervisor.overview.cards.mrrComposition.ofMrr', { defaultValue: '{{share}} of recurring MRR', share: segment.share })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SupervisorSectionCard>

                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.overview.cards.onboardingMonitor.eyebrow', { defaultValue: 'Live API Snapshot' })}
                    title={t('pages.supervisor.overview.cards.onboardingMonitor.title', { defaultValue: 'Configuration and onboarding monitor' })}
                    description={t('pages.supervisor.overview.cards.onboardingMonitor.description', { defaultValue: 'Counts here come from existing supervisor APIs. Readiness scoring and audit telemetry are not connected yet.' })}
                >
                    <div className="grid gap-3">
                        {[
                            {
                                label: 'Pending public signups',
                                value: publicSignupsQuery.isLoading ? '...' : String(pendingPublicSignups),
                                detail: publicSignupsQuery.isError ? 'Public signups API unavailable.' : 'Pending payment or paid signups awaiting completion.',
                            },
                            {
                                label: 'Completed public signups',
                                value: publicSignupsQuery.isLoading ? '...' : String(completedPublicSignups),
                                detail: publicSignupsQuery.isError ? 'Public signups API unavailable.' : 'Onboarding records completed by the webhook flow.',
                            },
                            {
                                label: 'Failed or expired signups',
                                value: publicSignupsQuery.isLoading ? '...' : String(failedPublicSignups),
                                detail: publicSignupsQuery.isError ? 'Public signups API unavailable.' : 'Checkout records that did not complete successfully.',
                            },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-brand-slate/15 bg-white/70 px-4 py-3 dark:border-brand-light/10 dark:bg-brand-light/5">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">{item.label}</p>
                                    <p className="text-2xl font-semibold text-brand-navy dark:text-brand-light">{item.value}</p>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-brand-slate dark:text-brand-light/75">{item.detail}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-brand-slate/20 bg-brand-slate/10 px-4 py-4 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                        {t('pages.supervisor.overview.cards.onboardingMonitor.auditNote', {
                            defaultValue: 'Coming soon: platform readiness and reliability scoring will require live audit-log and monitoring endpoints.',
                        })}
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
