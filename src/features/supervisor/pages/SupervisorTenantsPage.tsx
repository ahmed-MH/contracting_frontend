import { Building2, Globe2, TriangleAlert, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { useConfirm } from '../../../context/ConfirmContext';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import {
    useCreateSupervisorCheckoutSession,
    useSupervisorSubscriptions,
    useSupervisorTenants,
    useSuspendSupervisorTenant,
    type SupervisorSubscription,
    type SupervisorTenant,
} from '../hooks/useSupervisor';

interface TenantTableRow {
    id: number;
    name: string;
    plan: string;
    footprint: string;
    userCount: string;
    region: string;
    mrr: string;
    billingStatus: string;
    operationalStatus: string;
    isActive: boolean;
    planId?: number;
}

function formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function mapBillingStatus(subscription?: SupervisorSubscription): string {
    if (!subscription) return 'Not linked';
    if (subscription.status === 'ACTIVE') return 'Paid';
    if (subscription.status === 'PAST_DUE') return 'Overdue';
    return 'Suspended';
}

function LoadingPanel() {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/45 p-6 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
            Loading supervisor tenants...
        </div>
    );
}

function EmptyPanel({ label }: { label: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-brand-light/70 bg-brand-light/35 p-8 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
            {label}
        </div>
    );
}

export default function SupervisorTenantsPage() {
    const { t } = useTranslation('common');
    const { confirm } = useConfirm();
    const tenantsQuery = useSupervisorTenants();
    const subscriptionsQuery = useSupervisorSubscriptions();
    const suspendTenantMutation = useSuspendSupervisorTenant();
    const checkoutMutation = useCreateSupervisorCheckoutSession();

    const tenants = tenantsQuery.data ?? [];
    const subscriptions = subscriptionsQuery.data ?? [];
    const subscriptionsByTenantId = useMemo(() => {
        return new Map(subscriptions.map((subscription) => [subscription.tenantId, subscription]));
    }, [subscriptions]);

    const tenantRows = useMemo<TenantTableRow[]>(() => {
        return tenants.map((tenant: SupervisorTenant) => {
            const subscription = subscriptionsByTenantId.get(tenant.id);
            return {
                id: tenant.id,
                name: tenant.name,
                planId: subscription?.planId,
                plan: subscription?.planName ?? 'Unassigned',
                footprint: subscription ? `${subscription.hotelUsage} hotels` : 'Not reported',
                userCount: subscription ? `${subscription.userUsage} platform users` : 'No seat data',
                region: 'Platform tenant',
                mrr: subscription ? formatMoney(subscription.monthlyRecurringRevenue, subscription.currency) : 'Not linked',
                billingStatus: mapBillingStatus(subscription),
                operationalStatus: tenant.isActive ? 'Active' : 'Suspended',
                isActive: tenant.isActive,
            };
        });
    }, [subscriptionsByTenantId, tenants]);

    const activeTenants = tenantRows.filter((tenant) => tenant.isActive).length;
    const suspendedTenants = tenantRows.length - activeTenants;
    const totalUsers = subscriptions.reduce((total, subscription) => total + subscription.userUsage, 0);
    const totalHotels = subscriptions.reduce((total, subscription) => total + subscription.hotelUsage, 0);
    const watchlistCount = subscriptions.filter((subscription) => subscription.status !== 'ACTIVE').length + suspendedTenants;

    const handleSuspendTenant = async (tenant: TenantTableRow) => {
        if (await confirm({
            title: t('pages.supervisor.tenants.confirmSuspend.title', { defaultValue: 'Suspend {{name}}?', name: tenant.name }),
            description: t('pages.supervisor.tenants.confirmSuspend.description', {
                defaultValue: 'This disables the tenant at the platform layer without exposing or editing operational tenant records.',
            }),
            confirmLabel: t('pages.supervisor.tenants.confirmSuspend.confirmLabel', { defaultValue: 'Suspend tenant' }),
            variant: 'danger',
        })) {
            suspendTenantMutation.mutate(tenant.id);
        }
    };

    const handleCheckout = (tenant: TenantTableRow) => {
        if (!tenant.planId) return;
        checkoutMutation.mutate(
            { tenantId: tenant.id, planId: tenant.planId },
            {
                onSuccess: (session) => {
                    window.location.assign(session.checkoutUrl);
                },
            },
        );
    };

    const tenantColumns: SupervisorTableColumn<TenantTableRow>[] = [
        {
            key: 'organization',
            label: 'Organization',
            render: (tenant) => (
                <div>
                    <p className="font-semibold text-brand-navy dark:text-brand-light">{tenant.name}</p>
                    <p className="mt-1 text-xs text-brand-slate">Plan {tenant.plan}</p>
                </div>
            ),
        },
        {
            key: 'footprint',
            label: 'Footprint',
            render: (tenant) => (
                <div className="text-brand-navy dark:text-brand-light">
                    <p>{tenant.footprint}</p>
                    <p className="mt-1 text-xs text-brand-slate">{tenant.userCount}</p>
                </div>
            ),
        },
        {
            key: 'region',
            label: 'Region',
            render: (tenant) => <span className="text-brand-slate dark:text-brand-light/75">{tenant.region}</span>,
        },
        {
            key: 'mrr',
            label: 'MRR',
            render: (tenant) => <span className="font-semibold text-brand-navy dark:text-brand-light">{tenant.mrr}</span>,
        },
        {
            key: 'billingStatus',
            label: 'Billing',
            render: (tenant) => (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    tenant.billingStatus === 'Paid'
                        ? 'bg-brand-mint/10 text-brand-mint'
                        : 'bg-brand-slate/10 text-brand-slate'
                }`}>
                    {tenant.billingStatus}
                </span>
            ),
        },
        {
            key: 'operationalStatus',
            label: 'Platform Status',
            render: (tenant) => <span className="text-brand-slate dark:text-brand-light/75">{tenant.operationalStatus}</span>,
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (tenant) => tenant.isActive ? (
                <div className="flex justify-end gap-2">
                    {tenant.planId ? (
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-9 rounded-lg px-3 text-xs"
                            disabled={checkoutMutation.isPending}
                            onClick={() => handleCheckout(tenant)}
                        >
                            Checkout
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-9 rounded-lg px-3 text-xs"
                        disabled={suspendTenantMutation.isPending}
                        onClick={() => { void handleSuspendTenant(tenant); }}
                    >
                        Suspend
                    </Button>
                </div>
            ) : (
                <span className="text-xs font-medium text-brand-slate dark:text-brand-light/75">Suspended</span>
            ),
        },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.tenants.header.eyebrow', { defaultValue: 'Tenants / Organizations' })}
                title={t('pages.supervisor.tenants.header.title', { defaultValue: 'Billing-aware portfolio view for every registered organization.' })}
                description={t('pages.supervisor.tenants.header.description', { defaultValue: 'Supervisors can monitor tenant lifecycle, subscription posture, and suspension risk here without opening a single operational contract, simulator, room, or affiliate record.' })}
                badge={tenantsQuery.isLoading
                    ? t('pages.supervisor.tenants.header.loadingBadge', { defaultValue: 'Loading organizations' })
                    : t('pages.supervisor.tenants.header.badge', { defaultValue: '{{count}} organizations', count: tenants.length })}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupervisorMetricCard
                    label={t('pages.supervisor.tenants.metrics.activeOrganizations.label', { defaultValue: 'Active Organizations' })}
                    value={`${activeTenants}`}
                    delta={t('pages.supervisor.tenants.metrics.activeOrganizations.delta', { defaultValue: 'Backend tenants API' })}
                    description={t('pages.supervisor.tenants.metrics.activeOrganizations.description', { defaultValue: 'Organizations currently active on the platform.' })}
                    icon={Building2}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.tenants.metrics.regionsCovered.label', { defaultValue: 'Subscription Hotels' })}
                    value={`${totalHotels}`}
                    delta={t('pages.supervisor.tenants.metrics.regionsCovered.delta', { defaultValue: 'From subscriptions API' })}
                    description={t('pages.supervisor.tenants.metrics.regionsCovered.description', { defaultValue: 'Hotel usage reported by current subscription records.' })}
                    icon={Globe2}
                    tone="navy"
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.tenants.metrics.platformUsers.label', { defaultValue: 'Platform Users' })}
                    value={`${totalUsers}`}
                    delta={t('pages.supervisor.tenants.metrics.platformUsers.delta', { defaultValue: 'Provisioned seats' })}
                    description={t('pages.supervisor.tenants.metrics.platformUsers.description', { defaultValue: 'Total licensed users across all tenant subscriptions.' })}
                    icon={Users}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.tenants.metrics.watchlist.label', { defaultValue: 'Watchlist' })}
                    value={`${watchlistCount}`}
                    delta={t('pages.supervisor.tenants.metrics.watchlist.delta', { defaultValue: 'Needs billing review' })}
                    description={t('pages.supervisor.tenants.metrics.watchlist.description', { defaultValue: 'Organizations approaching suspension or downgrade action.' })}
                    icon={TriangleAlert}
                    tone="amber"
                />
            </section>

            <SupervisorSectionCard
                eyebrow={t('pages.supervisor.tenants.cards.organizationRoster.eyebrow', { defaultValue: 'Organization Roster' })}
                title={t('pages.supervisor.tenants.cards.organizationRoster.title', { defaultValue: 'Tenant management table' })}
                description={t('pages.supervisor.tenants.cards.organizationRoster.description', { defaultValue: 'Use this supervisor-safe table to review plan allocation, billing posture, and high-level fleet size.' })}
            >
                {tenantsQuery.isLoading ? (
                    <LoadingPanel />
                ) : tenantsQuery.isError ? (
                    <EmptyPanel label={t('pages.supervisor.tenants.errors.loadFailed', { defaultValue: 'Unable to load tenants from the supervisor API right now.' })} />
                ) : tenantRows.length === 0 ? (
                    <EmptyPanel label={t('pages.supervisor.tenants.empty', { defaultValue: 'No tenants have been created yet.' })} />
                ) : (
                    <SupervisorDataTable
                        columns={tenantColumns}
                        rows={tenantRows}
                        rowKey={(tenant) => String(tenant.id)}
                    />
                )}
            </SupervisorSectionCard>
        </div>
    );
}
