import { CircleDollarSign, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import {
    planPrivilegeMatrix,
    platformPlans,
    subscriptionWatchlist,
} from '../data/supervisor.data';

const privilegeColumns: SupervisorTableColumn<(typeof planPrivilegeMatrix)[number]>[] = [
    {
        key: 'capability',
        label: 'Capability',
        render: (row) => <span className="font-semibold text-brand-navy dark:text-brand-light">{row.capability}</span>,
    },
    {
        key: 'free',
        label: 'Free',
        render: (row) => <span className="text-brand-slate dark:text-brand-light/75">{row.free}</span>,
    },
    {
        key: 'pro',
        label: 'Pro',
        render: (row) => <span className="text-brand-slate dark:text-brand-light/75">{row.pro}</span>,
    },
    {
        key: 'enterprise',
        label: 'Enterprise',
        render: (row) => <span className="text-brand-slate dark:text-brand-light/75">{row.enterprise}</span>,
    },
];

const subscriptionColumns: SupervisorTableColumn<(typeof subscriptionWatchlist)[number]>[] = [
    {
        key: 'organization',
        label: 'Organization',
        render: (row) => (
            <div>
                <p className="font-semibold text-brand-navy dark:text-brand-light">{row.organization}</p>
                <p className="mt-1 text-xs text-brand-slate">{row.plan}</p>
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

export default function SupervisorPlatformSettingsPage() {
    const { t } = useTranslation('common');
    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.plans.header.eyebrow', { defaultValue: 'SaaS Plans & Pricing' })}
                title={t('pages.supervisor.plans.header.title', { defaultValue: 'Supervisor platform settings for plans, privileges, and subscriptions.' })}
                description={t('pages.supervisor.plans.header.description', { defaultValue: 'This is the dedicated platform-management surface for packaging the SaaS offer. It replaces any temptation to navigate into tenant operational tabs.' })}
                badge={t('pages.supervisor.plans.header.badge', { defaultValue: 'Platform settings' })}
                actions={<Button className="h-11 rounded-2xl px-5">{t('pages.supervisor.plans.header.publish', { defaultValue: 'Publish Plan Changes' })}</Button>}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupervisorMetricCard
                    label={t('pages.supervisor.plans.metrics.activePlans.label', { defaultValue: 'Active Plans' })}
                    value="3"
                    delta={t('pages.supervisor.plans.metrics.activePlans.delta', { defaultValue: 'Free, Pro, Enterprise' })}
                    description={t('pages.supervisor.plans.metrics.activePlans.description', { defaultValue: 'Current commercial packaging offered across the platform.' })}
                    icon={Layers3}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.plans.metrics.planAttachRate.label', { defaultValue: 'Plan Attach Rate' })}
                    value="81%"
                    delta={t('pages.supervisor.plans.metrics.planAttachRate.delta', { defaultValue: 'Paid tiers' })}
                    description={t('pages.supervisor.plans.metrics.planAttachRate.description', { defaultValue: 'Share of active organizations on paid plans.' })}
                    icon={CircleDollarSign}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.plans.metrics.privilegesUpdated.label', { defaultValue: 'Privileges Updated' })}
                    value="14"
                    delta={t('pages.supervisor.plans.metrics.privilegesUpdated.delta', { defaultValue: 'This quarter' })}
                    description={t('pages.supervisor.plans.metrics.privilegesUpdated.description', { defaultValue: 'Limit and entitlement changes published by platform ops.' })}
                    icon={ShieldCheck}
                    tone="navy"
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.plans.metrics.expansionUpsell.label', { defaultValue: 'Expansion Upsell' })}
                    value="$22.6k"
                    delta={t('pages.supervisor.plans.metrics.expansionUpsell.delta', { defaultValue: 'Pipeline MRR' })}
                    description={t('pages.supervisor.plans.metrics.expansionUpsell.description', { defaultValue: 'Expected revenue from plan upgrades already in motion.' })}
                    icon={Sparkles}
                />
            </section>

            <SupervisorSectionCard
                eyebrow={t('pages.supervisor.plans.cards.planCatalog.eyebrow', { defaultValue: 'Plan Catalog' })}
                title={t('pages.supervisor.plans.cards.planCatalog.title', { defaultValue: 'SaaS plan lineup' })}
                description={t('pages.supervisor.plans.cards.planCatalog.description', { defaultValue: 'Cards summarize the customer-facing packaging while the configuration form below governs the actual privileges.' })}
            >
                <div className="grid gap-4 xl:grid-cols-3">
                    {platformPlans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`rounded-2xl border p-6 ${
                                index === 1
                                    ? 'border-brand-mint/35 bg-brand-navy text-brand-light shadow-md'
                                    : 'border-brand-light/70 bg-brand-light/72 text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light'
                            }`}
                        >
                            <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                                index === 1 ? 'text-brand-mint' : 'text-brand-slate'
                            }`}>
                                {t(`pages.supervisor.plans.cards.planCatalog.plans.${index}.name`, { defaultValue: plan.name })}
                            </p>
                            <div className="mt-4 flex items-end gap-1">
                                <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                                {plan.cycle && (
                                    <span className={`pb-1 text-sm ${index === 1 ? 'text-brand-slate' : 'text-brand-slate'}`}>
                                        {plan.cycle}
                                    </span>
                                )}
                            </div>
                            <p className={`mt-3 text-sm leading-6 ${index === 1 ? 'text-brand-slate' : 'text-brand-slate dark:text-brand-light/75'}`}>
                                {t(`pages.supervisor.plans.cards.planCatalog.plans.${index}.summary`, { defaultValue: plan.summary })}
                            </p>
                            <div className="mt-5 space-y-2">
                                {plan.limits.map((limit, limitIndex) => (
                                    <div
                                        key={limit}
                                        className={`rounded-2xl px-4 py-3 text-sm ${
                                            index === 1
                                                ? 'bg-brand-light/8 text-brand-slate'
                                                : 'bg-brand-light text-brand-navy dark:bg-brand-light/5 dark:text-brand-light'
                                        }`}
                                    >
                                        {t(`pages.supervisor.plans.cards.planCatalog.plans.${index}.limits.${limitIndex}`, { defaultValue: limit })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </SupervisorSectionCard>

            <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.plans.cards.privilegeMatrix.eyebrow', { defaultValue: 'Privilege Matrix' })}
                    title={t('pages.supervisor.plans.cards.privilegeMatrix.title', { defaultValue: 'Limits and privileges by plan' })}
                    description={t('pages.supervisor.plans.cards.privilegeMatrix.description', { defaultValue: 'These rows define what each subscription tier is allowed to unlock across the SaaS platform.' })}
                >
                    <SupervisorDataTable
                        columns={privilegeColumns}
                        rows={[...planPrivilegeMatrix]}
                        rowKey={(row) => row.capability}
                    />
                </SupervisorSectionCard>

                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.plans.cards.settingsForm.eyebrow', { defaultValue: 'Platform Settings Form' })}
                    title={t('pages.supervisor.plans.cards.settingsForm.title', { defaultValue: 'Plan policy editor' })}
                    description={t('pages.supervisor.plans.cards.settingsForm.description', { defaultValue: 'UI structure for the supervisor configuration workflow covering pricing, limits, and gated privileges.' })}
                >
                    <form className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.0c4fc109', { defaultValue: "Plan name" })}</span>
                                <Input defaultValue="Pro" className="h-12 rounded-2xl px-4 focus-brand" />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.d6837f37', { defaultValue: "Monthly price" })}</span>
                                <Input defaultValue="499" className="h-12 rounded-2xl px-4 focus-brand" />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.6ccec319', { defaultValue: "Max hotels" })}</span>
                                <Input defaultValue="10" className="h-12 rounded-2xl px-4 focus-brand" />
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.be35581d', { defaultValue: "Max users" })}</span>
                                <Input defaultValue="50" className="h-12 rounded-2xl px-4 focus-brand" />
                            </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.53862b3a', { defaultValue: "API access" })}</span>
                                <select className="h-12 w-full rounded-2xl border border-brand-slate/30 bg-brand-light px-4 text-sm shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-slate/50 dark:bg-brand-navy/80 dark:text-brand-light">
                                    <option>{t('auto.features.supervisor.pages.supervisorplatformsettingspage.a7cae788', { defaultValue: "Enabled" })}</option>
                                    <option>{t('auto.features.supervisor.pages.supervisorplatformsettingspage.24b15b5f', { defaultValue: "Disabled" })}</option>
                                </select>
                            </label>
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.0b64cd63', { defaultValue: "Support tier" })}</span>
                                <select className="h-12 w-full rounded-2xl border border-brand-slate/30 bg-brand-light px-4 text-sm shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-slate/50 dark:bg-brand-navy/80 dark:text-brand-light">
                                    <option>{t('auto.features.supervisor.pages.supervisorplatformsettingspage.499e68ec', { defaultValue: "Priority" })}</option>
                                    <option>{t('auto.features.supervisor.pages.supervisorplatformsettingspage.9a0ed073', { defaultValue: "Standard" })}</option>
                                    <option>{t('auto.features.supervisor.pages.supervisorplatformsettingspage.ff6ca35f', { defaultValue: "Dedicated" })}</option>
                                </select>
                            </label>
                        </div>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.f5b37b70', { defaultValue: "Privilege notes" })}</span>
                            <textarea
                                rows={5}
                                defaultValue="Includes API access, CSV export, platform audit retention, and multi-hotel seat governance."
                                className="w-full rounded-2xl border border-brand-slate/30 bg-brand-light px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-slate/50 dark:bg-brand-navy/80 dark:text-brand-light"
                            />
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <Button type="button" className="h-11 rounded-2xl px-5">
                                Save Draft
                            </Button>
                            <Button type="button" variant="secondary" className="h-11 rounded-2xl px-5">
                                Simulate Price Change
                            </Button>
                        </div>
                    </form>
                </SupervisorSectionCard>
            </section>

            <SupervisorSectionCard
                eyebrow={t('pages.supervisor.plans.cards.subscriptions.eyebrow', { defaultValue: 'Subscriptions' })}
                title={t('pages.supervisor.plans.cards.subscriptions.title', { defaultValue: 'Supervisor subscription watchlist' })}
                description={t('pages.supervisor.plans.cards.subscriptions.description', { defaultValue: 'Upcoming renewals and billing risk, kept entirely at the subscription layer.' })}
            >
                <SupervisorDataTable
                    columns={subscriptionColumns}
                    rows={[...subscriptionWatchlist]}
                    rowKey={(row) => row.organization}
                />
            </SupervisorSectionCard>
        </div>
    );
}
