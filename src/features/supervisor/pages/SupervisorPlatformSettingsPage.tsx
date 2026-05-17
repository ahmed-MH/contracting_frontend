import { CheckCircle2, CircleDollarSign, CreditCard, Hotel, KeyRound, Layers3, LockKeyhole, ShieldCheck, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
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
    key: string;
    capability: string;
    values: Record<number, string>;
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

function formatPriceParts(amount: number, currency: string): { symbol: string; amount: string; cadence: string } {
    const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    });
    const parts = formatter.formatToParts(amount);
    const symbol = parts.find((part) => part.type === 'currency')?.value ?? currency;
    const amountLabel = parts
        .filter((part) => part.type !== 'currency' && part.type !== 'literal')
        .map((part) => part.value)
        .join('');

    return {
        symbol,
        amount: amountLabel || String(amount),
        cadence: currency,
    };
}

function formatPlanPeriod(plan: SupervisorPlan): string {
    const price = formatPriceParts(plan.monthlyPrice, plan.currency);
    if (plan.monthlyPrice <= 0) return price.cadence;
    return plan.billingType === 'RECURRING' ? `${price.cadence} / month` : `${price.cadence} one-time`;
}

function billingTypeLabel(type: SupervisorPlan['billingType']): string {
    return type === 'RECURRING' ? 'Monthly subscription' : 'One-time payment';
}

function formatLimitValue(value: number): string {
    return value >= 9999 ? 'Unlimited' : String(value);
}

function parseFormNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatPreviewPrice(state: PlanFormState): string {
    const amount = parseFormNumber(state.monthlyPrice);
    const currency = state.currency.trim() || 'USD';

    try {
        return formatMoney(amount, currency);
    } catch {
        return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
}

function getPreviewFeatures(state: PlanFormState): string[] {
    const features = state.features
        .split(/\n|,/)
        .map((feature) => feature.trim())
        .filter(Boolean);

    if (features.length > 0) return features.slice(0, 4);

    return [
        `${state.maxHotels || '0'} hotel${state.maxHotels === '1' ? '' : 's'}`,
        `${state.maxUsers || '0'} user${state.maxUsers === '1' ? '' : 's'}`,
        `${state.supportTier || 'Standard'} support`,
    ];
}

function PlanLivePreview({ state, title = 'Live plan preview' }: { state: PlanFormState; title?: string }) {
    const features = getPreviewFeatures(state);

    return (
        <aside className="lg:sticky lg:top-4">
            <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-slate dark:text-brand-light/60">{title}</p>
                <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/60">
                    This updates as you edit the plan.
                </p>
            </div>
            <div className="rounded-3xl border border-brand-slate/15 bg-white/85 p-6 text-brand-navy shadow-xl shadow-brand-navy/10 dark:border-brand-mint/25 dark:bg-brand-navy dark:text-brand-light dark:shadow-2xl dark:shadow-brand-navy/20">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-mint">
                            {state.name.trim() || 'New plan'}
                        </p>
                        <p className="mt-5 text-4xl font-semibold tracking-tight">
                            {formatPreviewPrice(state)}
                        </p>
                        {parseFormNumber(state.monthlyPrice) > 0 ? (
                            <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/55">
                                {state.billingType === 'ONE_TIME' ? 'one-time payment' : 'per month'}
                            </p>
                        ) : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        state.isActive
                            ? 'bg-brand-mint/15 text-brand-mint'
                            : 'bg-brand-slate/10 text-brand-slate dark:bg-brand-light/10 dark:text-brand-light/60'
                    }`}>
                        {state.isActive ? 'Active' : 'Draft'}
                    </span>
                </div>

                <p className="mt-5 min-h-12 text-sm leading-6 text-brand-slate dark:text-brand-light/70">
                    {state.description.trim() || 'Describe what this SaaS plan unlocks for tenant organizations.'}
                </p>

                <div className="mt-6 grid gap-2">
                    <div className="rounded-2xl bg-brand-slate/8 px-4 py-3 text-sm dark:bg-brand-light/8">
                        <span className="font-semibold text-brand-navy dark:text-brand-light">{state.maxHotels || '0'}</span> hotels included
                    </div>
                    <div className="rounded-2xl bg-brand-slate/8 px-4 py-3 text-sm dark:bg-brand-light/8">
                        <span className="font-semibold text-brand-navy dark:text-brand-light">{state.maxUsers || '0'}</span> user seats
                    </div>
                    <div className="rounded-2xl bg-brand-slate/8 px-4 py-3 text-sm dark:bg-brand-light/8">
                        API access: <span className="font-semibold text-brand-navy dark:text-brand-light">{state.apiAccess}</span>
                    </div>
                    <div className="rounded-2xl bg-brand-slate/8 px-4 py-3 text-sm dark:bg-brand-light/8">
                        {state.supportTier || 'Standard'} support
                    </div>
                </div>

                <div className="mt-6 space-y-2">
                    {features.map((feature) => (
                        <div key={feature} className="rounded-2xl bg-brand-mint/10 px-4 py-3 text-sm text-brand-slate dark:text-brand-light/80">
                            {feature}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
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
    const fromPlans = (key: string, capability: string, getValue: (plan: SupervisorPlan) => string): PrivilegeRow => ({
        key,
        capability,
        values: Object.fromEntries(plans.map((plan) => [plan.id, getValue(plan)])),
    });

    return [
        fromPlans('price', 'Price', (plan) => `${formatPlanPrice(plan)} ${formatPlanCadence(plan)}`.trim()),
        fromPlans('hotel-limit', 'Hotel limit', (plan) => formatLimitValue(plan.maxHotels)),
        fromPlans('user-seats', 'User seats', (plan) => formatLimitValue(plan.maxUsers)),
        fromPlans('api-access', 'API access', (plan) => plan.apiAccess ? 'Yes' : 'No'),
        fromPlans('support-tier', 'Support tier', (plan) => plan.supportTier || 'N/A'),
        fromPlans('billing-type', 'Billing type', (plan) => plan.billingType === 'ONE_TIME' ? 'One-time' : 'Recurring'),
        fromPlans('feature-count', 'Feature count', (plan) => String(plan.features.length)),
        fromPlans('checkout', 'Checkout', (plan) => plan.stripePriceId ? 'Stripe ready' : 'Missing price ID'),
    ];
}

function SupervisorPlanFeatureRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
    return (
        <div className="flex items-start gap-3 text-sm font-semibold leading-5 text-brand-slate dark:text-brand-light/80">
            <Icon className="mt-0.5 shrink-0 text-brand-mint" size={17} strokeWidth={1.9} />
            <span>{children}</span>
        </div>
    );
}

function SupervisorPlanCard({ plan, onEdit }: { plan: SupervisorPlan; onEdit: (plan: SupervisorPlan) => void }) {
    const price = formatPriceParts(plan.monthlyPrice, plan.currency);
    const visibleFeatures = plan.features.slice(0, 5);

    return (
        <article
            className={clsx(
                'group flex min-h-[430px] flex-col rounded-2xl border bg-white/85 p-5 shadow-sm shadow-brand-navy/5 transition backdrop-blur-xl dark:bg-brand-light/[0.055] dark:shadow-none md:p-6',
                plan.apiAccess
                    ? 'border-brand-mint/30 shadow-brand-mint/5'
                    : 'border-brand-slate/15 dark:border-brand-light/12',
                'hover:-translate-y-0.5 hover:border-brand-mint/45 hover:shadow-lg hover:shadow-brand-navy/10',
            )}
        >
            <div className="flex flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="mr-auto text-2xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        {plan.name}
                    </h3>
                    <span className={clsx(
                        'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]',
                        plan.isActive
                            ? 'border-brand-mint/25 bg-brand-mint/10 text-brand-mint'
                            : 'border-brand-slate/20 bg-brand-slate/8 text-brand-slate dark:border-brand-light/20 dark:bg-brand-light/8 dark:text-brand-light/60',
                    )}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {plan.apiAccess ? (
                        <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-mint">
                            API ready
                        </span>
                    ) : null}
                </div>

                <div className="mt-7 flex items-end gap-2">
                    <span className="pb-4 text-lg font-semibold text-brand-slate dark:text-brand-light/60">{price.symbol}</span>
                    <span className="text-5xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{price.amount}</span>
                    <span className="pb-2 text-sm font-semibold text-brand-slate dark:text-brand-light/70">{formatPlanPeriod(plan)}</span>
                </div>

                <p className="mt-5 min-h-[2.75rem] text-base font-semibold leading-6 text-brand-navy dark:text-brand-light">
                    {plan.description || 'Configure what this SaaS plan unlocks for tenant organizations.'}
                </p>

                <Button
                    type="button"
                    variant="secondary"
                    className="mt-6 h-12 w-full rounded-xl px-5"
                    onClick={() => onEdit(plan)}
                >
                    <CreditCard size={16} />
                    Update plan
                </Button>

                <div className="mt-6 space-y-3.5">
                    <SupervisorPlanFeatureRow icon={Hotel}>{formatLimitValue(plan.maxHotels)} hotel{plan.maxHotels === 1 ? '' : 's'}</SupervisorPlanFeatureRow>
                    <SupervisorPlanFeatureRow icon={Users}>{formatLimitValue(plan.maxUsers)} team seat{plan.maxUsers === 1 ? '' : 's'}</SupervisorPlanFeatureRow>
                    <SupervisorPlanFeatureRow icon={plan.apiAccess ? KeyRound : LockKeyhole}>
                        {plan.apiAccess ? 'API access included' : 'API access not included'}
                    </SupervisorPlanFeatureRow>
                    <SupervisorPlanFeatureRow icon={ShieldCheck}>{plan.supportTier || 'Standard'} support</SupervisorPlanFeatureRow>
                    <SupervisorPlanFeatureRow icon={CreditCard}>{billingTypeLabel(plan.billingType)}</SupervisorPlanFeatureRow>
                    {visibleFeatures.map((feature) => (
                        <SupervisorPlanFeatureRow key={feature} icon={CheckCircle2}>{feature}</SupervisorPlanFeatureRow>
                    ))}
                    {!plan.stripePriceId ? (
                        <SupervisorPlanFeatureRow icon={CircleDollarSign}>Stripe price ID missing</SupervisorPlanFeatureRow>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function LoadingPanel({ label }: { label: string }) {
    return (
        <div className="rounded-2xl border border-brand-slate/15 bg-white/65 p-6 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
            {label}
        </div>
    );
}

function EmptyPanel({ label }: { label: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-brand-slate/25 bg-white/55 p-8 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
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
    const updatePlanMutation = useUpdateSupervisorPlan(() => setIsEditModalOpen(false));
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [formState, setFormState] = useState<PlanFormState | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{row.planName}</p>
                </div>
            ),
        },
        {
            key: 'mrr',
            label: 'Recurring MRR',
            render: (row) => <span className="font-semibold text-brand-navy dark:text-brand-light">{formatMoney(row.monthlyRecurringRevenue, row.currency)}</span>,
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
                    row.status === 'ACTIVE'
                        ? 'border-brand-mint/20 bg-brand-mint/10 text-brand-mint'
                        : 'border-brand-slate/20 bg-brand-slate/8 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/10 dark:text-brand-light/75'
                }`}>
                    {row.status.replace('_', ' ')}
                </span>
            ),
        },
    ];

    const privilegeColumns = useMemo<SupervisorTableColumn<PrivilegeRow>[]>(() => [
        {
            key: 'capability',
            label: 'Capability',
            className: 'min-w-48',
            render: (row) => <span className="font-semibold text-brand-navy dark:text-brand-light">{row.capability}</span>,
        },
        ...plans.map((plan) => ({
            key: `plan-${plan.id}`,
            label: plan.name,
            className: 'min-w-40',
            render: (row: PrivilegeRow) => (
                <span className="text-brand-slate dark:text-brand-light/75">
                    {row.values[plan.id] ?? 'N/A'}
                </span>
            ),
        })),
    ], [plans]);

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

    const openEditModal = (plan = selectedPlan) => {
        if (!plan) return;
        setSelectedPlanId(plan.id);
        setFormState(mapPlanToForm(plan));
        setIsEditModalOpen(true);
    };

    const renderPlanFields = (
        state: PlanFormState,
        updateField: <K extends keyof PlanFormState>(field: K, value: PlanFormState[K]) => void,
    ) => (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.0c4fc109', { defaultValue: 'Plan name' })}</span>
                    <Input required value={state.name} onChange={(event) => updateField('name', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.d6837f37', { defaultValue: 'Price' })}</span>
                    <Input required type="number" min="0" value={state.monthlyPrice} onChange={(event) => updateField('monthlyPrice', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.6ccec319', { defaultValue: 'Max hotels' })}</span>
                    <Input required type="number" min="1" value={state.maxHotels} onChange={(event) => updateField('maxHotels', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.be35581d', { defaultValue: 'Max users' })}</span>
                    <Input required type="number" min="1" value={state.maxUsers} onChange={(event) => updateField('maxUsers', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
            </div>

            <label className="space-y-2">
                <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('pages.supervisor.plans.form.description', { defaultValue: 'Description' })}</span>
                <Input required value={state.description} onChange={(event) => updateField('description', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('pages.supervisor.plans.form.billingType', { defaultValue: 'Billing type' })}</span>
                    <select
                        value={state.billingType}
                        onChange={(event) => updateField('billingType', event.target.value as PlanFormState['billingType'])}
                        className="h-12 w-full rounded-2xl border border-brand-slate/30 bg-brand-light px-4 text-sm shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-slate/50 dark:bg-brand-navy/80 dark:text-brand-light"
                    >
                        <option value="RECURRING">{t('pages.supervisor.plans.form.billingTypeRecurring', { defaultValue: 'Recurring' })}</option>
                        <option value="ONE_TIME">{t('pages.supervisor.plans.form.billingTypeOneTime', { defaultValue: 'One-time' })}</option>
                    </select>
                    <p className="text-xs leading-5 text-brand-slate dark:text-brand-light/60">
                        {state.billingType === 'ONE_TIME'
                            ? t('pages.supervisor.plans.form.billingTypeOneTimeHelp', { defaultValue: 'One-time plans require a one-time Stripe Price ID.' })
                            : t('pages.supervisor.plans.form.billingTypeRecurringHelp', { defaultValue: 'Recurring plans require a recurring Stripe Price ID.' })}
                    </p>
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('pages.supervisor.plans.form.currency', { defaultValue: 'Currency' })}</span>
                    <Input required value={state.currency} onChange={(event) => updateField('currency', event.target.value.toUpperCase())} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.53862b3a', { defaultValue: 'API access' })}</span>
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
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.0b64cd63', { defaultValue: 'Support tier' })}</span>
                    <Input required value={state.supportTier} onChange={(event) => updateField('supportTier', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" />
                </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('pages.supervisor.plans.form.stripeProductId', { defaultValue: 'Stripe Product ID' })}</span>
                    <Input value={state.stripeProductId} onChange={(event) => updateField('stripeProductId', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" placeholder="prod_..." />
                </label>
                <label className="space-y-2">
                    <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('pages.supervisor.plans.form.stripePriceId', { defaultValue: 'Stripe Price ID' })}</span>
                    <Input value={state.stripePriceId} onChange={(event) => updateField('stripePriceId', event.target.value)} className="h-12 rounded-2xl px-4 focus-brand" placeholder="price_..." />
                </label>
            </div>

            {!state.stripePriceId.trim() ? (
                <div className="rounded-2xl border border-brand-slate/20 bg-brand-slate/10 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                    {t('pages.supervisor.plans.form.stripePriceWarning', { defaultValue: 'This plan can be published without a Stripe Price ID, but checkout stays unavailable until one is added. The Price ID must match the selected billing type.' })}
                </div>
            ) : (
                <div className="rounded-2xl border border-brand-mint/20 bg-brand-mint/10 px-4 py-3 text-sm text-brand-slate dark:border-brand-mint/25 dark:bg-brand-mint/10 dark:text-brand-light/75">
                    {state.billingType === 'ONE_TIME'
                        ? t('pages.supervisor.plans.form.oneTimePriceHint', { defaultValue: 'Use a one-time Stripe Price ID for this plan. Checkout will use payment mode. The Price ID must match the selected billing type.' })
                        : t('pages.supervisor.plans.form.recurringPriceHint', { defaultValue: 'Use a recurring Stripe Price ID for this plan. Checkout will use subscription mode. The Price ID must match the selected billing type.' })}
                </div>
            )}

            <label className="flex items-center gap-3 rounded-2xl border border-brand-slate/15 bg-white/70 px-4 py-3 text-sm font-medium text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                <input
                    type="checkbox"
                    checked={state.isActive}
                    onChange={(event) => updateField('isActive', event.target.checked)}
                    className="h-4 w-4 rounded border-brand-slate/30 text-brand-mint focus:ring-brand-mint"
                />
                {t('pages.supervisor.plans.form.activePlan', { defaultValue: 'Publish as active plan' })}
            </label>

            <label className="space-y-2">
                <span className="text-sm font-medium text-brand-slate dark:text-brand-light/70">{t('auto.features.supervisor.pages.supervisorplatformsettingspage.f5b37b70', { defaultValue: 'Privilege notes' })}</span>
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
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-11 min-w-36 rounded-2xl px-5"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        {t('pages.supervisor.plans.header.create', { defaultValue: 'Create Plan' })}
                    </Button>
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
                description={t('pages.supervisor.plans.cards.planCatalog.description', { defaultValue: 'Cards summarize the customer-facing packaging. Update any plan directly from its catalog card.' })}
            >
                {plansQuery.isLoading ? (
                    <LoadingPanel label="Loading platform plans..." />
                ) : plansQuery.isError ? (
                    <EmptyPanel label="Unable to load plans from the supervisor API right now." />
                ) : plans.length === 0 ? (
                    <EmptyPanel label="No platform plans have been configured yet." />
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        {plans.map((plan) => (
                            <SupervisorPlanCard key={plan.id} plan={plan} onEdit={openEditModal} />
                        ))}
                    </div>
                )}
            </SupervisorSectionCard>

            <SupervisorSectionCard
                eyebrow={t('pages.supervisor.plans.cards.privilegeMatrix.eyebrow', { defaultValue: 'Privilege Matrix' })}
                title={t('pages.supervisor.plans.cards.privilegeMatrix.title', { defaultValue: 'Limits and privileges by plan' })}
                description={t('pages.supervisor.plans.cards.privilegeMatrix.description', { defaultValue: 'These rows define what each subscription tier is allowed to unlock across the SaaS platform.' })}
            >
                {plansQuery.isLoading ? (
                    <LoadingPanel label="Loading privilege matrix..." />
                ) : plansQuery.isError ? (
                    <EmptyPanel label="Unable to load plan privileges." />
                ) : plans.length === 0 ? (
                    <EmptyPanel label="No platform plans are available for comparison yet." />
                ) : (
                    <SupervisorDataTable
                        columns={privilegeColumns}
                        rows={privilegeRows}
                        rowKey={(row) => row.key}
                    />
                )}
            </SupervisorSectionCard>

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
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={selectedPlan
                    ? t('pages.supervisor.plans.editModal.title', { defaultValue: 'Update {{name}} plan', name: selectedPlan.name })
                    : t('pages.supervisor.plans.editModal.titleFallback', { defaultValue: 'Update SaaS plan' })}
                maxWidth="max-w-6xl"
            >
                {!formState ? (
                    <EmptyPanel label="Select a plan before opening the update modal." />
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                            <div className="space-y-4">
                                {renderPlanFields(formState, updateFormField)}
                                <div className="flex flex-wrap justify-end gap-3 border-t border-brand-slate/15 pt-4 dark:border-brand-light/10">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="h-11 rounded-2xl px-5"
                                        disabled={updatePlanMutation.isPending}
                                        onClick={() => setIsEditModalOpen(false)}
                                    >
                                        {t('actions.cancel', { defaultValue: 'Cancel' })}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="h-11 rounded-2xl px-5"
                                        disabled={updatePlanMutation.isPending}
                                        onClick={() => handleSavePlan(false)}
                                    >
                                        {updatePlanMutation.isPending
                                            ? t('pages.supervisor.plans.editModal.saving', { defaultValue: 'Saving...' })
                                            : t('pages.supervisor.plans.editModal.saveDraft', { defaultValue: 'Save draft' })}
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="h-11 rounded-2xl px-5"
                                        disabled={updatePlanMutation.isPending}
                                    >
                                        {updatePlanMutation.isPending
                                            ? t('pages.supervisor.plans.editModal.publishing', { defaultValue: 'Publishing...' })
                                            : t('pages.supervisor.plans.editModal.publish', { defaultValue: 'Publish changes' })}
                                    </Button>
                                </div>
                            </div>
                            <PlanLivePreview state={formState} />
                        </div>
                    </form>
                )}
            </Modal>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={t('pages.supervisor.plans.createModal.title', { defaultValue: 'Create SaaS plan' })}
                maxWidth="max-w-6xl"
            >
                <form onSubmit={handleCreateSubmit}>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="space-y-4">
                            {renderPlanFields(createFormState, updateCreateFormField)}
                            <div className="flex flex-wrap justify-end gap-3 border-t border-brand-slate/15 pt-4 dark:border-brand-light/10">
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
                        </div>
                        <PlanLivePreview state={createFormState} />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
