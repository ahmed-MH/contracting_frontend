import { Building2, Globe2, TriangleAlert, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import { tenantOrganizations } from '../data/supervisor.data';

const tenantColumns: SupervisorTableColumn<(typeof tenantOrganizations)[number]>[] = [
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
                <p>{tenant.hotels} hotels</p>
                <p className="mt-1 text-xs text-brand-slate">{tenant.users} platform users</p>
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
];

export default function SupervisorTenantsPage() {
    const { t } = useTranslation('common');
    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.tenants.header.eyebrow', { defaultValue: 'Tenants / Organizations' })}
                title={t('pages.supervisor.tenants.header.title', { defaultValue: 'Billing-aware portfolio view for every registered organization.' })}
                description={t('pages.supervisor.tenants.header.description', { defaultValue: 'Supervisors can monitor tenant lifecycle, subscription posture, and suspension risk here without opening a single operational contract, simulator, room, or affiliate record.' })}
                badge={t('pages.supervisor.tenants.header.badge', { defaultValue: '48 organizations' })}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupervisorMetricCard
                    label={t('pages.supervisor.tenants.metrics.activeOrganizations.label', { defaultValue: 'Active Organizations' })}
                    value={`${tenantOrganizations.length}`}
                    delta={t('pages.supervisor.tenants.metrics.activeOrganizations.delta', { defaultValue: 'Fleet-wide' })}
                    description={t('pages.supervisor.tenants.metrics.activeOrganizations.description', { defaultValue: 'Organizations currently active on the platform.' })}
                    icon={Building2}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.tenants.metrics.regionsCovered.label', { defaultValue: 'Regions Covered' })}
                    value="4"
                    delta={t('pages.supervisor.tenants.metrics.regionsCovered.delta', { defaultValue: 'Global footprint' })}
                    description={t('pages.supervisor.tenants.metrics.regionsCovered.description', { defaultValue: 'Commercial reach represented across the current portfolio.' })}
                    icon={Globe2}
                    tone="navy"
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.tenants.metrics.platformUsers.label', { defaultValue: 'Platform Users' })}
                    value="152"
                    delta={t('pages.supervisor.tenants.metrics.platformUsers.delta', { defaultValue: 'Provisioned seats' })}
                    description={t('pages.supervisor.tenants.metrics.platformUsers.description', { defaultValue: 'Total licensed users across all tenant subscriptions.' })}
                    icon={Users}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.tenants.metrics.watchlist.label', { defaultValue: 'Watchlist' })}
                    value="2"
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
                <SupervisorDataTable
                    columns={tenantColumns}
                    rows={[...tenantOrganizations]}
                    rowKey={(tenant) => tenant.name}
                />
            </SupervisorSectionCard>
        </div>
    );
}
