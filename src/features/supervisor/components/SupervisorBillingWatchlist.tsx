import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SupervisorDataTable, type SupervisorTableColumn } from './SupervisorDataTable';
import type { SupervisorPlan, SupervisorSubscription, SupervisorTenant } from '../services/supervisor.service';

interface SupervisorBillingWatchlistProps {
    subscriptions: SupervisorSubscription[];
    tenants?: SupervisorTenant[];
    plans?: SupervisorPlan[];
    isLoading?: boolean;
    isError?: boolean;
    showSummaryChips?: boolean;
    showActions?: boolean;
    loadingLabel?: string;
    errorLabel?: string;
    emptyLabel?: string;
}

interface BillingWatchRow {
    id: number;
    organization: string;
    plan: string;
    billingType: 'RECURRING' | 'ONE_TIME';
    billingTypeLabel: string;
    revenue: string;
    revenueDetail: string;
    period: string;
    periodDetail: string;
    accessKey: 'active' | 'paymentRequired' | 'suspended';
    accessLabel: string;
    accessDetail: string;
    accessClass: string;
    riskKey: 'healthy' | 'stripePriceMissing' | 'planInactive' | 'collectPayment' | 'reviewAccess' | 'tenantSuspended' | 'noRenewalRequired';
    riskLabel: string;
    riskDetail: string;
    riskClass: string;
    tenantIsActive: boolean | null;
    actionLabel: string;
}

function formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value: string, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}

function panelClass(isDashed = false): string {
    return [
        'rounded-2xl border bg-white/65 p-6 text-sm text-brand-slate dark:bg-brand-light/5 dark:text-brand-light/75',
        isDashed ? 'border-dashed border-brand-slate/25 dark:border-brand-light/10' : 'border-brand-slate/15 dark:border-brand-light/10',
    ].join(' ');
}

function billingAccessClass(label: string): string {
    if (label === 'Active access') return 'border-brand-mint/20 bg-brand-mint/10 text-brand-mint';
    if (label === 'Payment required') return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200';
    return 'border-red-200 bg-red-100 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300';
}

function riskClass(label: string): string {
    if (label === 'Healthy' || label === 'No renewal required') return 'border-brand-mint/20 bg-brand-mint/10 text-brand-mint';
    if (label === 'Review access' || label === 'Tenant suspended') return 'border-red-200 bg-red-100 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300';
    return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200';
}

function watchRiskWeight(row: BillingWatchRow): number {
    if (row.riskLabel === 'Stripe price missing') return 0;
    if (row.accessLabel === 'Payment required') return 1;
    if (row.accessLabel === 'Suspended') return 2;
    if (row.riskLabel === 'Tenant suspended') return 3;
    if (row.period === 'Renewal date unavailable') return 4;
    return 5;
}

export function SupervisorBillingWatchlist({
    subscriptions,
    tenants = [],
    plans = [],
    isLoading = false,
    isError = false,
    showSummaryChips = true,
    showActions = true,
    loadingLabel,
    errorLabel,
    emptyLabel,
}: SupervisorBillingWatchlistProps) {
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

    const rows = useMemo<BillingWatchRow[]>(() => {
        const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
        const plansById = new Map(plans.map((plan) => [plan.id, plan]));

        return subscriptions
            .map((subscription) => {
                const billingType = subscription.billingType ?? 'RECURRING';
                const tenant = tenantsById.get(subscription.tenantId);
                const plan = plansById.get(subscription.planId);
                const isOneTime = billingType === 'ONE_TIME';
                const periodEnd = subscription.currentPeriodEnd || subscription.renewalDate;
                const accessKey: BillingWatchRow['accessKey'] = subscription.status === 'ACTIVE'
                    ? 'active'
                    : subscription.status === 'PAST_DUE'
                        ? 'paymentRequired'
                        : 'suspended';
                const accessLabel = accessKey === 'active'
                    ? 'Active access'
                    : accessKey === 'paymentRequired'
                        ? 'Payment required'
                        : 'Suspended';
                const tenantIsActive = tenant?.isActive ?? null;
                const planIsActive = plan?.isActive ?? null;
                const stripePriceIdPresent = plan ? Boolean(plan.stripePriceId) : null;
                const needsCheckout = subscription.status === 'PAST_DUE' || subscription.status === 'SUSPENDED';

                let riskKey: BillingWatchRow['riskKey'] = 'healthy';
                let riskLabel = 'Healthy';
                let riskDetail = t('pages.supervisor.billingWatchlist.risk.healthyDetail', { defaultValue: 'Recurring renewal is tracked' });

                if (needsCheckout && stripePriceIdPresent === false) {
                    riskKey = 'stripePriceMissing';
                    riskLabel = 'Stripe price missing';
                    riskDetail = t('pages.supervisor.billingWatchlist.risk.stripePriceMissingDetail', { defaultValue: 'Add a Stripe Price ID before checkout recovery' });
                } else if (planIsActive === false) {
                    riskKey = 'planInactive';
                    riskLabel = 'Plan inactive';
                    riskDetail = t('pages.supervisor.billingWatchlist.risk.planInactiveDetail', { defaultValue: 'Review plan configuration before recovery' });
                } else if (subscription.status === 'PAST_DUE') {
                    riskKey = 'collectPayment';
                    riskLabel = 'Collect payment';
                    riskDetail = t('pages.supervisor.billingWatchlist.risk.collectPaymentDetail', { defaultValue: 'Manual checkout or tenant payment recovery' });
                } else if (subscription.status === 'SUSPENDED') {
                    riskKey = 'reviewAccess';
                    riskLabel = 'Review access';
                    riskDetail = t('pages.supervisor.billingWatchlist.risk.reviewAccessDetail', { defaultValue: 'Billing access is suspended' });
                } else if (tenantIsActive === false) {
                    riskKey = 'tenantSuspended';
                    riskLabel = 'Tenant suspended';
                    riskDetail = t('pages.supervisor.billingWatchlist.risk.tenantSuspendedDetail', { defaultValue: 'Billing may be active, but platform access is off' });
                } else if (isOneTime) {
                    riskKey = 'noRenewalRequired';
                    riskLabel = 'No renewal required';
                    riskDetail = t('pages.supervisor.billingWatchlist.risk.noRenewalDetail', { defaultValue: 'One-time access is active' });
                } else if (!periodEnd) {
                    riskDetail = t('pages.supervisor.billingWatchlist.risk.renewalPendingDetail', { defaultValue: 'Active, renewal date pending sync' });
                }

                const period = isOneTime
                    ? t('pages.supervisor.billingWatchlist.period.noRenewal', { defaultValue: 'No renewal' })
                    : periodEnd
                        ? t('pages.supervisor.billingWatchlist.period.renews', { defaultValue: 'Renews {{date}}', date: formatDate(periodEnd, locale) })
                        : t('pages.supervisor.billingWatchlist.period.unavailable', { defaultValue: 'Renewal date unavailable' });

                return {
                    id: subscription.id,
                    organization: subscription.organizationName,
                    plan: subscription.planName,
                    billingType,
                    billingTypeLabel: isOneTime
                        ? t('pages.supervisor.billingWatchlist.billingType.oneTime', { defaultValue: 'One-time' })
                        : t('pages.supervisor.billingWatchlist.billingType.recurring', { defaultValue: 'Recurring' }),
                    revenue: isOneTime
                        ? t('pages.supervisor.billingWatchlist.revenue.oneTime', { defaultValue: 'One-time {{amount}}', amount: formatMoney(subscription.oneTimeRevenue ?? 0, subscription.currency) })
                        : t('pages.supervisor.billingWatchlist.revenue.mrr', { defaultValue: 'MRR {{amount}}', amount: formatMoney(subscription.monthlyRecurringRevenue, subscription.currency) }),
                    revenueDetail: isOneTime
                        ? t('pages.supervisor.billingWatchlist.revenue.noRecurringMrr', { defaultValue: 'No recurring MRR' })
                        : t('pages.supervisor.billingWatchlist.revenue.recurringDetail', { defaultValue: 'Recurring subscription' }),
                    period,
                    periodDetail: isOneTime
                        ? t('pages.supervisor.billingWatchlist.period.oneTimeDetail', { defaultValue: 'Lifetime / one-time access' })
                        : periodEnd
                            ? t('pages.supervisor.billingWatchlist.period.recurringDetail', { defaultValue: 'Recurring billing period' })
                            : t('pages.supervisor.billingWatchlist.period.unavailableDetail', { defaultValue: 'Stripe period end has not synced yet' }),
                    accessKey,
                    accessLabel,
                    accessDetail: accessLabel === 'Payment required'
                        ? t('pages.supervisor.billingWatchlist.access.paymentRequiredDetail', { defaultValue: 'Billing recovery needed' })
                        : accessLabel === 'Suspended'
                            ? t('pages.supervisor.billingWatchlist.access.suspendedDetail', { defaultValue: 'Access disabled by billing' })
                            : t('pages.supervisor.billingWatchlist.access.activeDetail', { defaultValue: 'Entitlements enabled' }),
                    accessClass: billingAccessClass(accessLabel),
                    riskKey,
                    riskLabel,
                    riskDetail,
                    riskClass: riskClass(riskLabel),
                    tenantIsActive,
                    actionLabel: subscription.status === 'PAST_DUE'
                        ? t('pages.supervisor.billingWatchlist.actions.reviewRecovery', { defaultValue: 'Review recovery' })
                        : t('pages.supervisor.billingWatchlist.actions.viewTenant', { defaultValue: 'View tenant' }),
                };
            })
            .sort((left, right) => watchRiskWeight(left) - watchRiskWeight(right) || left.organization.localeCompare(right.organization));
    }, [locale, plans, subscriptions, t, tenants]);

    const summary = useMemo(() => ({
        paymentRequired: rows.filter((row) => row.accessLabel === 'Payment required').length,
        activeAccess: rows.filter((row) => row.accessLabel === 'Active access').length,
        oneTimeAccess: rows.filter((row) => row.billingType === 'ONE_TIME').length,
        recurring: rows.filter((row) => row.billingType === 'RECURRING').length,
    }), [rows]);

    const columns = useMemo<SupervisorTableColumn<BillingWatchRow>[]>(() => {
        const baseColumns: SupervisorTableColumn<BillingWatchRow>[] = [
            {
                key: 'organization',
                label: t('pages.supervisor.billingWatchlist.columns.organization', { defaultValue: 'Organization' }),
                render: (row) => (
                    <div>
                        <p className="font-semibold text-brand-navy dark:text-brand-light">{row.organization}</p>
                        <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">
                            {t('pages.supervisor.billingWatchlist.planPrefix', { defaultValue: 'Plan {{plan}}', plan: row.plan })}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full border border-brand-slate/20 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/10 dark:text-brand-light/75">
                                {row.billingTypeLabel}
                            </span>
                            {row.tenantIsActive === false ? (
                                <span className="inline-flex rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
                                    {t('pages.supervisor.billingWatchlist.risk.tenantSuspended', { defaultValue: 'Tenant suspended' })}
                                </span>
                            ) : null}
                        </div>
                    </div>
                ),
            },
            {
                key: 'revenue',
                label: t('pages.supervisor.billingWatchlist.columns.revenue', { defaultValue: 'Revenue' }),
                render: (row) => (
                    <div>
                        <p className="font-semibold text-brand-navy dark:text-brand-light">{row.revenue}</p>
                        <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{row.revenueDetail}</p>
                    </div>
                ),
            },
            {
                key: 'access',
                label: t('pages.supervisor.billingWatchlist.columns.access', { defaultValue: 'Billing / access' }),
                render: (row) => (
                    <div>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${row.accessClass}`}>
                            {t(`pages.supervisor.billingWatchlist.access.${row.accessKey}`, { defaultValue: row.accessLabel })}
                        </span>
                        <p className="mt-2 text-xs text-brand-slate dark:text-brand-light/60">{row.accessDetail}</p>
                    </div>
                ),
            },
            {
                key: 'period',
                label: t('pages.supervisor.billingWatchlist.columns.period', { defaultValue: 'Period' }),
                render: (row) => (
                    <div>
                        <p className="font-semibold text-brand-navy dark:text-brand-light">{row.period}</p>
                        <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{row.periodDetail}</p>
                    </div>
                ),
            },
            {
                key: 'risk',
                label: t('pages.supervisor.billingWatchlist.columns.risk', { defaultValue: 'Risk / next step' }),
                render: (row) => (
                    <div>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${row.riskClass}`}>
                            {t(`pages.supervisor.billingWatchlist.risk.${row.riskKey}`, { defaultValue: row.riskLabel })}
                        </span>
                        <p className="mt-2 max-w-[14rem] text-xs leading-5 text-brand-slate dark:text-brand-light/60">{row.riskDetail}</p>
                    </div>
                ),
            },
        ];

        if (!showActions) return baseColumns;

        return [
            ...baseColumns,
            {
                key: 'action',
                label: t('pages.supervisor.billingWatchlist.columns.action', { defaultValue: 'Action' }),
                className: 'text-right',
                render: (row) => (
                    <Link
                        to="/tenants"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-brand-slate/15 bg-white/70 px-3 text-xs font-semibold text-brand-navy shadow-sm transition hover:border-brand-mint/40 hover:text-brand-mint focus:outline-none focus:ring-2 focus:ring-brand-mint/30 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light dark:hover:text-brand-mint"
                        title={t('pages.supervisor.billingWatchlist.actions.openTenantTitle', { defaultValue: 'Open tenant management for {{organization}}', organization: row.organization })}
                    >
                        {row.actionLabel}
                        <ArrowRight size={14} />
                    </Link>
                ),
            },
        ];
    }, [showActions, t]);

    if (isLoading) {
        return <div className={panelClass()}>{loadingLabel ?? t('pages.supervisor.billingWatchlist.loading', { defaultValue: 'Loading billing watchlist...' })}</div>;
    }

    if (isError) {
        return <div className={panelClass()}>{errorLabel ?? t('pages.supervisor.billingWatchlist.error', { defaultValue: 'Could not load billing watchlist.' })}</div>;
    }

    if (rows.length === 0) {
        return <div className={panelClass(true)}>{emptyLabel ?? t('pages.supervisor.billingWatchlist.empty', { defaultValue: 'No subscriptions found yet.' })}</div>;
    }

    return (
        <div className="space-y-4">
            {showSummaryChips ? (
                <div className="grid gap-3 md:grid-cols-4">
                    {[
                        [t('pages.supervisor.billingWatchlist.summary.paymentRequired', { defaultValue: 'Payment required' }), summary.paymentRequired],
                        [t('pages.supervisor.billingWatchlist.summary.activeAccess', { defaultValue: 'Active access' }), summary.activeAccess],
                        [t('pages.supervisor.billingWatchlist.summary.oneTimeAccess', { defaultValue: 'One-time access' }), summary.oneTimeAccess],
                        [t('pages.supervisor.billingWatchlist.summary.recurring', { defaultValue: 'Recurring' }), summary.recurring],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-brand-slate/15 bg-white/70 px-4 py-3 dark:border-brand-light/10 dark:bg-brand-light/5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/55">{label}</p>
                            <p className="mt-1 text-2xl font-semibold text-brand-navy dark:text-brand-light">{value}</p>
                        </div>
                    ))}
                </div>
            ) : null}
            <SupervisorDataTable
                columns={columns}
                rows={rows}
                rowKey={(row) => String(row.id)}
            />
        </div>
    );
}
