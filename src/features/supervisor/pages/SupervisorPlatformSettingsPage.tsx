import { CircleDollarSign, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import {
    useCreateSupervisorPlan,
    useSupervisorPlans,
    useSupervisorSubscriptions,
    useSupervisorSubscriptionSummary,
    useUpdateSupervisorPlan,
    type CreateSupervisorPlanPayload,
    type SupervisorPlan,
    type UpdateSupervisorPlanPayload,
} from '../hooks/useSupervisor';

interface PrivilegeRow {
    capability: string;
    free: string;
    pro: string;
    enterprise: string;
}

interface PlanFormState {
    name: string;
    description: string;
    monthlyPrice: string;
    billingType: 'RECURRING' | 'ONE_TIME';
    currency: string;
    maxHotels: string;
    maxUsers: string;
    apiAccess: 'Enabled' | 'Disabled';
    supportTier: string;
    features: string;
    stripeProductId: string;
    stripePriceId: string;
    isActive: boolean;
}

function formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPlanPrice(plan: SupervisorPlan): string {
    if (plan.monthlyPrice === 0 && plan.name.toLowerCase().includes('enterprise')) {
        return 'Custom';
    }

    return formatMoney(plan.monthlyPrice, plan.currency);
}

function formatPlanCadence(plan: SupervisorPlan): string {
    if (plan.monthlyPrice <= 0) return '';
    return plan.billingType === 'ONE_TIME' ? 'one-time' : '/month';
}

function mapPlanToForm(plan: SupervisorPlan): PlanFormState {
    return {
        name: plan.name,
        description: plan.description,
        monthlyPrice: String(plan.monthlyPrice),
        billingType: plan.billingType ?? 'RECURRING',
        currency: plan.currency,
        maxHotels: String(plan.maxHotels),
        maxUsers: String(plan.maxUsers),
        apiAccess: plan.apiAccess ? 'Enabled' : 'Disabled',
        supportTier: plan.supportTier,
        features: plan.features.join('\n'),
        stripeProductId: plan.stripeProductId ?? '',
        stripePriceId: plan.stripePriceId ?? '',
        isActive: plan.isActive,
    };
}

function createEmptyPlanForm(): PlanFormState {
    return {
        name: '',
        description: '',
        monthlyPrice: '0',
        billingType: 'RECURRING',
        currency: 'USD',
        maxHotels: '1',
        maxUsers: '1',
        apiAccess: 'Disabled',
        supportTier: 'Standard',
        features: '',
        stripeProductId: '',
        stripePriceId: '',
        isActive: true,
    };
}

function buildPlanPayload(formState: PlanFormState, publish = formState.isActive): CreateSupervisorPlanPayload {
    return {
        name: formState.name.trim(),
        description: formState.description.trim(),
        monthlyPrice: Number(formState.monthlyPrice),
        billingType: formState.billingType,
        currency: formState.currency.trim() || 'USD',
        maxHotels: Number(formState.maxHotels),
        maxUsers: Number(formState.maxUsers),
        apiAccess: formState.apiAccess === 'Enabled',
        supportTier: formState.supportTier.trim(),
        features: formState.features
            .split(/\n|,/)
            .map((feature) => feature.trim())
            .filter(Boolean),
        stripeProductId: formState.stripeProductId.trim() || undefined,
        stripePriceId: formState.stripePriceId.trim() || undefined,
        isActive: publish,
    };
}

function buildPrivilegeRows(plans: SupervisorPlan[]): PrivilegeRow[] {
    const findPlan = (name: string) => plans.find((plan) => plan.name.toLowerCase() === name);
    const free = findPlan('free');
    const pro = findPlan('pro');
    const enterprise = findPlan('enterprise');

    return [
        {
            capability: 'Hotel limit',
            free: free ? String(free.maxHotels) : 'N/A',
            pro: pro ? String(pro.maxHotels) : 'N/A',
            enterprise: enterprise ? (enterprise.maxHotels >= 9999 ? 'Unlimited' : String(enterprise.maxHotels)) : 'N/A',
        },
        {
            capability: 'User seats',
            free: free ? String(free.maxUsers) : 'N/A',
            pro: pro ? String(pro.maxUsers) : 'N/A',
            enterprise: enterprise ? (enterprise.maxUsers >= 9999 ? 'Unlimited' : String(enterprise.maxUsers)) : 'N/A',
        },
        {
            capability: 'API access',
            free: free?.apiAccess ? 'Yes' : 'No',
            pro: pro?.apiAccess ? 'Yes' : 'No',
            enterprise: enterprise?.apiAccess ? 'Yes' : 'No',
        },
        {
            capability: 'Support tier',
            free: free?.supportTier ?? 'N/A',
            pro: pro?.supportTier ?? 'N/A',
            enterprise: enterprise?.supportTier ?? 'N/A',
        },
        {
            capability: 'Feature count',
            free: free ? String(free.features.length) : 'N/A',
            pro: pro ? String(pro.features.length) : 'N/A',
            enterprise: enterprise ? String(enterprise.features.length) : 'N/A',
        },
    ];
}

function LoadingPanel({ label }: { label: string }) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/45 p-6 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
            {label}
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

export default function SupervisorPlatformSettingsPage() {
    const { t } = useTranslation('common');
    const plansQuery = useSupervisorPlans();
    const subscriptionsQuery = useSupervisorSubscriptions();
    const summaryQuery = useSupervisorSubscriptionSummary();
    const createPlanMutation = useCreateSupervisorPlan(() => {
        setIsCreateModalOpen(false);
        setCreateFormState(createEmptyPlanForm());
    });
    const updatePlanMutation = useUpdateSupervisorPlan();
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [formState, setFormState] = useState<PlanFormState | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormState, setCreateFormState] = useState<PlanFormState>(() => createEmptyPlanForm());

    const plans = plansQuery.data ?? [];
    const subscriptions = subscriptionsQuery.data ?? [];
    const summary = summaryQuery.data;

    const selectedPlan = useMemo(() => {
        if (plans.length === 0) return undefined;
        return plans.find((plan) => plan.id === selectedPlanId)
            ?? plans.find((plan) => plan.name.toLowerCase() === 'pro')
            ?? plans[0];
    }, [plans, selectedPlanId]);

    useEffect(() => {
        if (!selectedPlan) return;
        setSelectedPlanId(selectedPlan.id);
        setFormState(mapPlanToForm(selectedPlan));
    }, [selectedPlan]);

    const privilegeRows = useMemo(() => buildPrivilegeRows(plans), [plans]);
    const activePlanCount = plans.filter((plan) => plan.isActive).length;
    const totalFeatureCount = plans.reduce((total, plan) => total + plan.features.length, 0);
    const paidAttachRate = summary && summary.totalSubscriptions > 0
        ? Math.round((summary.activeSubscriptions / summary.totalSubscriptions) * 100)
        : 0;

    const subscriptionColumns: SupervisorTableColumn<(typeof subscriptions)[number]>[] = [
        {
            key: 'organization',
            label: 'Organization',
            render: (row) => (
                <div>
                    <p className="font-semibold text-brand-navy dark:text-brand-light">{row.organizationName}</p>
                    <p className="mt-1 text-xs text-brand-slate">{row.planName}</p>
                </div>
            ),
        },
        {
            key: 'mrr',
            label: 'MRR',
            render: (row) => <span className="font-semibold text-brand-navy dark:text-brand-light">{formatMoney(row.monthlyRecurringRevenue, row.currency)}</span>,
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
                    row.status === 'ACTIVE'
                        ? 'bg-brand-mint/10 text-brand-mint'
                        : 'bg-brand-slate/10 text-brand-slate'
                }`}>
                    {row.status.replace('_', ' ')}
                </span>
            ),
        },
    ];

    const privilegeColumns: SupervisorTableColumn<PrivilegeRow>[] = [
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

    const updateFormField = <K extends keyof PlanFormState>(field: K, value: PlanFormState[K]) => {
        setFormState((current) => current ? { ...current, [field]: value } : current);
    };

    const updateCreateFormField = <K extends keyof PlanFormState>(field: K, value: PlanFormState[K]) => {
        setCreateFormState((current) => ({ ...current, [field]: value }));
    };

    const handleSavePlan = (publish: boolean) => {
        if (!selectedPlan || !formState) return;

        const payload: UpdateSupervisorPlanPayload = buildPlanPayload(
            { ...formState, currency: formState.currency.trim() || selectedPlan.currency },
            publish,
        );

        updatePlanMutation.mutate({ id: selectedPlan.id, payload });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleSavePlan(true);
    };

    const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createPlanMutation.mutate(buildPlanPayload(createFormState));
    };

    const renderPlanFields = (
        state: PlanFormState,
        updateField: <K extends keyof PlanFormState>(field: K, value: PlanFormState[K]) => void,
    ) => (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.0c4fc109', { defaultValue: 'Plan name' })}</span>
                    <Input required value={state.name} onChange={(event) => updateField('name', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.d6837f37', { defaultValue: 'Price' })}</span>
                    <Input required type="number" min="0" value={state.monthlyPrice} onChange={(event) => updateField('monthlyPrice', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.6ccec319', { defaultValue: 'Max hotels' })}</span>
                    <Input required type="number" min="1" value={state.maxHotels} onChange={(event) => updateField('maxHotels', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.be35581d', { defaultValue: 'Max users' })}</span>
                    <Input required type="number" min="1" value={state.maxUsers} onChange={(event) => updateField('maxUsers', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
            </div>

            <label className="space-y-2">
                <span className="text-sm font-medium text-brand-slate">{t('pages.supervisor.plans.form.description', { defaultValue: 'Description' })}</span>
                <Input required value={state.description} onChange={(event) => updateField('description', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('pages.supervisor.plans.form.billingType', { defaultValue: 'Billing type' })}</span>
                    <select
                        value={state.billingType}
                        onChange={(event) => updateField('billingType', event.target.value as PlanFormState['billingType'])}
                        className="h-12 w-full rounded-2xl border border-brand-slate/30 bg-brand-light px-4 text-sm shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-slate/50 dark:bg-brand-navy/80 dark:text-brand-light"
                    >
                        <option value="RECURRING">{t('pages.supervisor.plans.form.billingTypeRecurring', { defaultValue: 'Recurring' })}</option>
                        <option value="ONE_TIME">{t('pages.supervisor.plans.form.billingTypeOneTime', { defaultValue: 'One-time' })}</option>
                    </select>
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('pages.supervisor.plans.form.currency', { defaultValue: 'Currency' })}</span>
                    <Input required value={state.currency} onChange={(event) => updateField('currency', event.target.value.toUpperCase())} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.53862b3a', { defaultValue: 'API access' })}</span>
                    <select
                        value={state.apiAccess}
                        onChange={(event) => updateField('apiAccess', event.target.value as PlanFormState['apiAccess'])}
                        className="h-12 w-full rounded-2xl border border-brand-slate/30 bg-brand-light px-4 text-sm shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-slate/50 dark:bg-brand-navy/80 dark:text-brand-light"
                    >
                        <option>{t('auto.features.supervisor.pages.supervisorplatformsettingspage.a7cae788', { defaultValue: 'Enabled' })}</option>
                        <option>{t('auto.features.supervisor.pages.supervisorplatformsettingspage.24b15b5f', { defaultValue: 'Disabled' })}</option>
                    </select>
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.0b64cd63', { defaultValue: 'Support tier' })}</span>
                    <Input required value={state.supportTier} onChange={(event) => updateField('supportTier', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('pages.supervisor.plans.form.stripeProductId', { defaultValue: 'Stripe Product ID' })}</span>
                    <Input value={state.stripeProductId} onChange={(event) => updateField('stripeProductId', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" placeholder="prod_..." />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate">{t('pages.supervisor.plans.form.stripePriceId', { defaultValue: 'Stripe Price ID' })}</span>
                    <Input value={state.stripePriceId} onChange={(event) => updateField('stripePriceId', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" placeholder="price_..." />
                </label>
            </div>

            {!state.stripePriceId.trim() ? (
                <div className="rounded-2xl border border-brand-slate/20 bg-brand-slate/10 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                    {t('pages.supervisor.plans.form.stripePriceWarning', { defaultValue: 'This plan can be published without a Stripe Price ID, but checkout stays unavailable until one is added.' })}
                </div>
            ) : (
                <div className="rounded-2xl border border-brand-mint/20 bg-brand-mint/10 px-4 py-3 text-sm text-brand-slate dark:border-brand-mint/25 dark:bg-brand-mint/10 dark:text-brand-light/75">
                    {state.billingType === 'ONE_TIME'
                        ? t('pages.supervisor.plans.form.oneTimePriceHint', { defaultValue: 'Use a one-time Stripe Price ID for this plan. Checkout will use payment mode.' })
                        : t('pages.supervisor.plans.form.recurringPriceHint', { defaultValue: 'Use a recurring Stripe Price ID for this plan. Checkout will use subscription mode.' })}
                </div>
            )}

            <label className="flex items-center gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/50 px-4 py-3 text-sm font-medium text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                <input
                    type="checkbox"
                    checked={state.isActive}
                    onChange={(event) => updateField('isActive', event.target.checked)}
                    className="h-4 w-4 rounded border-brand-slate/30 text-brand-mint focus:ring-brand-mint"
                />
                {t('pages.supervisor.plans.form.activePlan', { defaultValue: 'Publish as active plan' })}
            </label>

            <label className="space-y-2">
                <span className="text-sm font-medium text-brand-slate">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.f5b37b70', { defaultValue: 'Privilege notes' })}</span>
                <textarea
                    rows={5}
                    required
                    value={state.features}
                    onChange={(event) => updateField('features', event.target.value)}
                    className="w-full rounded-2xl border border-brand-slate/30 bg-brand-light px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-slate/50 dark:bg-brand-navy/80 dark:text-brand-light"
                />
            </label>
        </>
    );

    return (
        <div className="space-y-6 p-4 md:p-6">
            <SupervisorPageHeader
                eyebrow={t('pages.supervisor.plans.header.eyebrow', { defaultValue: 'SaaS Plans & Pricing' })}
                title={t('pages.supervisor.plans.header.title', { defaultValue: 'Supervisor platform settings for plans, privileges, and subscriptions.' })}
                description={t('pages.supervisor.plans.header.description', { defaultValue: 'This is the dedicated platform-management surface for packaging the SaaS offer. It replaces any temptation to navigate into tenant operational tabs.' })}
                badge={plansQuery.isLoading
                    ? t('pages.supervisor.plans.header.loadingBadge', { defaultValue: 'Loading plans' })
                    : t('pages.supervisor.plans.header.badge', { defaultValue: '{{count}} platform plans', count: plans.length })}
                actions={(
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-11 min-w-36 rounded-2xl px-5"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            {t('pages.supervisor.plans.header.create', { defaultValue: 'Create Plan' })}
                        </Button>
                        <Button
                            type="button"
                            className="h-11 min-w-48 rounded-2xl px-5"
                            disabled={!selectedPlan || !formState || updatePlanMutation.isPending}
                            onClick={() => handleSavePlan(true)}
                        >
                            {t('pages.supervisor.plans.header.publish', { defaultValue: 'Publish Plan Changes' })}
                        </Button>
                    </>
                )}
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupervisorMetricCard
                    label={t('pages.supervisor.plans.metrics.activePlans.label', { defaultValue: 'Active Plans' })}
                    value={`${activePlanCount}`}
                    delta={t('pages.supervisor.plans.metrics.activePlans.delta', { defaultValue: 'From plans API' })}
                    description={t('pages.supervisor.plans.metrics.activePlans.description', { defaultValue: 'Current commercial packaging offered across the platform.' })}
                    icon={Layers3}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.plans.metrics.planAttachRate.label', { defaultValue: 'Plan Attach Rate' })}
                    value={`${paidAttachRate}%`}
                    delta={t('pages.supervisor.plans.metrics.planAttachRate.delta', { defaultValue: 'Active subscriptions' })}
                    description={t('pages.supervisor.plans.metrics.planAttachRate.description', { defaultValue: 'Share of active organizations on paid plans.' })}
                    icon={CircleDollarSign}
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.plans.metrics.privilegesUpdated.label', { defaultValue: 'Privileges Tracked' })}
                    value={`${totalFeatureCount}`}
                    delta={t('pages.supervisor.plans.metrics.privilegesUpdated.delta', { defaultValue: 'Across active plans' })}
                    description={t('pages.supervisor.plans.metrics.privilegesUpdated.description', { defaultValue: 'Limit and entitlement changes published by platform ops.' })}
                    icon={ShieldCheck}
                    tone="navy"
                />
                <SupervisorMetricCard
                    label={t('pages.supervisor.plans.metrics.expansionUpsell.label', { defaultValue: 'At-risk MRR' })}
                    value={summary ? formatMoney(summary.atRiskMonthlyRecurringRevenue, summary.currency) : '$0'}
                    delta={t('pages.supervisor.plans.metrics.expansionUpsell.delta', { defaultValue: 'From subscription summary' })}
                    description={t('pages.supervisor.plans.metrics.expansionUpsell.description', { defaultValue: 'Expected revenue from plan upgrades already in motion.' })}
                    icon={Sparkles}
                />
            </section>

            <SupervisorSectionCard
                eyebrow={t('pages.supervisor.plans.cards.planCatalog.eyebrow', { defaultValue: 'Plan Catalog' })}
                title={t('pages.supervisor.plans.cards.planCatalog.title', { defaultValue: 'SaaS plan lineup' })}
                description={t('pages.supervisor.plans.cards.planCatalog.description', { defaultValue: 'Cards summarize the customer-facing packaging while the configuration form below governs the actual privileges.' })}
            >
                {plansQuery.isLoading ? (
                    <LoadingPanel label="Loading platform plans..." />
                ) : plansQuery.isError ? (
                    <EmptyPanel label="Unable to load plans from the supervisor API right now." />
                ) : plans.length === 0 ? (
                    <EmptyPanel label="No platform plans have been configured yet." />
                ) : (
                    <div className="grid gap-4 xl:grid-cols-3">
                        {plans.map((plan, index) => {
                            const isSelected = plan.id === selectedPlan?.id;
                            return (
                                <button
                                    type="button"
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`rounded-2xl border p-6 text-left transition ${
                                        isSelected
                                            ? 'border-brand-mint/35 bg-brand-navy text-brand-light shadow-md'
                                            : 'border-brand-light/70 bg-brand-light/72 text-brand-navy hover:border-brand-mint/25 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light'
                                    }`}
                                >
                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                                        isSelected ? 'text-brand-mint' : 'text-brand-slate'
                                    }`}>
                                        {t(`pages.supervisor.plans.cards.planCatalog.plans.${index}.name`, { defaultValue: plan.name })}
                                    </p>
                                    <div className="mt-4 flex items-end gap-1">
                                        <span className="text-4xl font-semibold tracking-tight">{formatPlanPrice(plan)}</span>
                                        {plan.monthlyPrice > 0 && (
                                            <span className="pb-1 text-sm text-brand-slate">{formatPlanCadence(plan)}</span>
                                        )}
                                    </div>
                                    <p className={`mt-3 text-sm leading-6 ${isSelected ? 'text-brand-slate' : 'text-brand-slate dark:text-brand-light/75'}`}>
                                        {t(`pages.supervisor.plans.cards.planCatalog.plans.${index}.summary`, { defaultValue: plan.description })}
                                    </p>
                                    <div className="mt-5 space-y-2">
                                        {plan.features.map((feature, featureIndex) => (
                                            <div
                                                key={`${plan.id}-${feature}`}
                                                className={`rounded-2xl px-4 py-3 text-sm ${
                                                    isSelected
                                                        ? 'bg-brand-light/8 text-brand-slate'
                                                        : 'bg-brand-light text-brand-navy dark:bg-brand-light/5 dark:text-brand-light'
                                                }`}
                                            >
                                                {t(`pages.supervisor.plans.cards.planCatalog.plans.${index}.limits.${featureIndex}`, { defaultValue: feature })}
                                            </div>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </SupervisorSectionCard>

            <section className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.plans.cards.privilegeMatrix.eyebrow', { defaultValue: 'Privilege Matrix' })}
                    title={t('pages.supervisor.plans.cards.privilegeMatrix.title', { defaultValue: 'Limits and privileges by plan' })}
                    description={t('pages.supervisor.plans.cards.privilegeMatrix.description', { defaultValue: 'These rows define what each subscription tier is allowed to unlock across the SaaS platform.' })}
                >
                    {plansQuery.isLoading ? (
                        <LoadingPanel label="Loading privilege matrix..." />
                    ) : plansQuery.isError ? (
                        <EmptyPanel label="Unable to load plan privileges." />
                    ) : (
                        <SupervisorDataTable
                            columns={privilegeColumns}
                            rows={privilegeRows}
                            rowKey={(row) => row.capability}
                        />
                    )}
                </SupervisorSectionCard>

                <SupervisorSectionCard
                    eyebrow={t('pages.supervisor.plans.cards.settingsForm.eyebrow', { defaultValue: 'Platform Settings Form' })}
                    title={t('pages.supervisor.plans.cards.settingsForm.title', { defaultValue: 'Plan policy editor' })}
                    description={selectedPlan
                        ? t('pages.supervisor.plans.cards.settingsForm.descriptionSelected', { defaultValue: 'Editing {{name}} from the live supervisor plans API.', name: selectedPlan.name })
                        : t('pages.supervisor.plans.cards.settingsForm.description', { defaultValue: 'UI structure for the supervisor configuration workflow covering pricing, limits, and gated privileges.' })}
                >
                    {!formState ? (
                        <EmptyPanel label="Select a plan to edit its live backend configuration." />
                    ) : (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {renderPlanFields(formState, updateFormField)}

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    className="h-11 rounded-2xl px-5"
                                    disabled={updatePlanMutation.isPending}
                                    onClick={() => handleSavePlan(false)}
                                >
                                    Save Draft
                                </Button>
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    className="h-11 rounded-2xl px-5"
                                    disabled={updatePlanMutation.isPending}
                                >
                                    Publish Changes
                                </Button>
                            </div>
                        </form>
                    )}
                </SupervisorSectionCard>
            </section>

            <SupervisorSectionCard
                eyebrow={t('pages.supervisor.plans.cards.subscriptions.eyebrow', { defaultValue: 'Subscriptions' })}
                title={t('pages.supervisor.plans.cards.subscriptions.title', { defaultValue: 'Supervisor subscription watchlist' })}
                description={t('pages.supervisor.plans.cards.subscriptions.description', { defaultValue: 'Upcoming renewals and billing risk, kept entirely at the subscription layer.' })}
            >
                {subscriptionsQuery.isLoading ? (
                    <LoadingPanel label="Loading subscriptions..." />
                ) : subscriptionsQuery.isError ? (
                    <EmptyPanel label="Unable to load subscriptions from the supervisor API right now." />
                ) : subscriptions.length === 0 ? (
                    <EmptyPanel label="No subscriptions are available yet." />
                ) : (
                    <SupervisorDataTable
                        columns={subscriptionColumns}
                        rows={subscriptions}
                        rowKey={(row) => String(row.id)}
                    />
                )}
            </SupervisorSectionCard>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={t('pages.supervisor.plans.createModal.title', { defaultValue: 'Create SaaS plan' })}
                maxWidth="max-w-3xl"
            >
                <form className="space-y-4" onSubmit={handleCreateSubmit}>
                    {renderPlanFields(createFormState, updateCreateFormField)}
                    <div className="flex flex-wrap justify-end gap-3 border-t border-brand-light/70 pt-4 dark:border-brand-light/10">
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-11 rounded-2xl px-5"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            {t('actions.cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            type="submit"
                            className="h-11 rounded-2xl px-5"
                            disabled={createPlanMutation.isPending}
                        >
                            {createPlanMutation.isPending
                                ? t('pages.supervisor.plans.createModal.creating', { defaultValue: 'Creating...' })
                                : t('pages.supervisor.plans.createModal.submit', { defaultValue: 'Create plan' })}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
