import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import {
    ArrowRight,
    BadgeCheck,
    BedDouble,
    Briefcase,
    Building2,
    Calculator,
    CheckCircle2,
    CreditCard,
    Hotel,
    KeyRound,
    LockKeyhole,
    Mail,
    ShieldCheck,
    UserCog,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useTenantUsage } from '../../admin/hooks/useUsers';
import { useHotel } from '../../hotel/context/HotelContext';
import { contractService, type Contract } from '../../contracts/services/contract.service';
import type { ProformaInvoice } from '../../simulator/types/simulator.types';
import ModalShell from '../../../components/ui/ModalShell';
import apiClient from '../../../services/api.client';
import type { PaginatedResult } from '../../../types/pagination.types';
import { useAvailablePlans, useChangePassword, useCreateTenantCheckoutSession, useCurrentProfile, useSetupOrganization, useSyncTenantCheckoutSession, useUpdateProfile } from '../hooks/useProfile';
import type { AvailablePlan, CurrentProfile, TenantCheckoutSession } from '../services/profile.service';

interface ProfileSeasonWindow {
    key: string;
    label: string;
    startDate: string;
    endDate: string;
    contractCount: number;
}

function getDisplayName(profile?: CurrentProfile | null, fallback = 'Profile'): string {
    const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
    return name || profile?.email || fallback;
}

function getInitials(profile?: CurrentProfile | null): string {
    const source = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || profile?.email || 'U';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
}

function statusLabel(profile?: CurrentProfile | null): string {
    if (profile?.accountStatus) return profile.accountStatus.replace(/_/g, ' ');
    return profile?.isActive ? 'ACTIVE' : 'SUSPENDED';
}

function roleDescription(role: string | undefined, t: TFunction): string {
    if (role === 'ADMIN') return t('pages.profile.roles.admin', { defaultValue: 'Administrator with user, hotel, and organization access.' });
    if (role === 'COMMERCIAL') return t('pages.profile.roles.commercial', { defaultValue: 'Commercial user with access to assigned hotel operations.' });
    if (role === 'AGENT') return t('pages.profile.roles.agent', { defaultValue: 'Operational user focused on pricing tools.' });
    return t('pages.profile.roles.default', { defaultValue: 'User profile.' });
}

function formatLimit(value: number | null | undefined): string {
    return value === null || value === undefined ? 'Not assigned' : String(value);
}

function formatUsageNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? 'Not linked' : String(value);
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

function billingTypeLabel(type: AvailablePlan['billingType']): string {
    return type === 'RECURRING' ? 'Monthly subscription' : 'One-time payment';
}

function billingStatusLabel(status?: string | null): string {
    if (status === 'ACTIVE') return 'Active billing';
    if (status === 'PAST_DUE') return 'Payment required';
    if (status === 'SUSPENDED') return 'Billing suspended';
    if (status === 'NO_PLAN') return 'No plan';
    if (status === 'NO_ORGANIZATION') return 'Organization setup required';
    return status?.replace(/_/g, ' ') || 'Not linked';
}

function parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDate(value?: string | null): string {
    return value ? value.slice(0, 10) : '';
}

function isDateInsideRange(dateValue: string | null | undefined, startDate: string, endDate: string): boolean {
    const date = parseDate(dateValue);
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!date || !start || !end) return false;
    date.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return date >= start && date <= end;
}

function formatProfileSeasonLabel(startDate: string, endDate: string): string {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) return 'Season';

    const formatter = new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function getCurrentSeasonWindow(contracts: Contract[]): ProfileSeasonWindow | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byRange = new Map<string, ProfileSeasonWindow>();

    contracts.forEach((contract) => {
            const startDate = normalizeDate(contract.startDate);
            const endDate = normalizeDate(contract.endDate);
            if (!startDate || !endDate || !isDateInsideRange(today.toISOString(), startDate, endDate)) return;

            const key = `${startDate}|${endDate}`;
            const existing = byRange.get(key);
            if (existing) {
                existing.contractCount += 1;
                return;
            }

            byRange.set(key, {
                key,
                startDate,
                endDate,
                contractCount: 1,
                label: formatProfileSeasonLabel(startDate, endDate),
            });
    });

    return [...byRange.values()].sort((a, b) => b.contractCount - a.contractCount)[0] ?? null;
}

function dateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
}

function checkoutErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const data = (error as { response?: { data?: { message?: string | string[] } } }).response?.data;
        if (Array.isArray(data?.message)) return data.message.join(', ');
        if (data?.message) return data.message;
    }

    return error instanceof Error ? error.message : '';
}

function planStrength(plan: Pick<AvailablePlan, 'monthlyPrice' | 'maxHotels' | 'maxUsers' | 'apiAccess' | 'features'>): number {
    return (plan.monthlyPrice * 100)
        + (plan.maxHotels * 20)
        + (plan.maxUsers * 10)
        + (plan.apiAccess ? 500 : 0)
        + ((plan.features?.length ?? 0) * 5);
}

function planActionLabel(plan: AvailablePlan, currentPlan?: Pick<AvailablePlan, 'monthlyPrice' | 'maxHotels' | 'maxUsers' | 'apiAccess' | 'features'> | null): string {
    if (!currentPlan) return 'Choose this plan';
    return planStrength(plan) > planStrength(currentPlan) ? 'Upgrade' : 'Switch';
}

function ProfileCard({
    eyebrow,
    title,
    description,
    children,
    actions,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-brand-light/70 bg-brand-light/78 p-5 shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/5 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">{eyebrow}</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{title}</h2>
                    {description ? <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/75">{description}</p> : null}
                </div>
                {actions}
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function DetailTile({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: LucideIcon }) {
    return (
        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/55 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
            <div className="flex items-start gap-3">
                {Icon ? (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-mint/10 text-brand-mint">
                        <Icon size={17} />
                    </span>
                ) : null}
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate">{label}</p>
                    <div className="mt-2 break-words text-sm font-semibold text-brand-navy dark:text-brand-light">{value}</div>
                </div>
            </div>
        </div>
    );
}

function QuickAction({ to, label, description, icon: Icon }: { to: string; label: string; description: string; icon: LucideIcon }) {
    return (
        <Link
            to={to}
            className="group rounded-2xl border border-brand-light/70 bg-brand-light/60 p-4 transition hover:-translate-y-0.5 hover:border-brand-mint/30 hover:bg-brand-light/90 dark:border-brand-light/10 dark:bg-brand-light/5 dark:hover:bg-brand-light/8"
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint/10 text-brand-mint">
                <Icon size={17} />
            </span>
            <p className="mt-3 font-semibold text-brand-navy dark:text-brand-light">{label}</p>
            <p className="mt-1 text-sm leading-5 text-brand-slate dark:text-brand-light/70">{description}</p>
        </Link>
    );
}

function TextInput({
    label,
    value,
    onChange,
    type = 'text',
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    autoComplete?: string;
}) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                autoComplete={autoComplete}
                className="mt-2 h-12 w-full rounded-2xl border border-brand-light/70 bg-brand-light/70 px-4 text-sm font-semibold text-brand-navy outline-none transition focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
            />
        </label>
    );
}

function PlanFeatureRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
    return (
        <div className="flex items-start gap-3 text-sm font-semibold leading-5 text-brand-slate dark:text-brand-light/80">
            <Icon className="mt-0.5 shrink-0 text-brand-mint" size={17} strokeWidth={1.9} />
            <span>{children}</span>
        </div>
    );
}

function PlanCard({
    plan,
    isCurrent,
    isCheckingOut,
    actionLabel,
    onCheckout,
}: {
    plan: AvailablePlan;
    isCurrent: boolean;
    isCheckingOut: boolean;
    actionLabel: string;
    onCheckout: (planId: number) => void;
}) {
    const price = formatPriceParts(plan.monthlyPrice, plan.currency);
    const periodLabel = plan.billingType === 'RECURRING' ? `${price.cadence} / month` : `${price.cadence} one-time`;
    const visibleFeatures = plan.features.slice(0, 5);
    const planIntro = plan.description || 'Unlock the full contracting workspace.';

    return (
        <article
            className={clsx(
                'group flex min-h-[430px] flex-col rounded-2xl border bg-brand-light/88 p-5 shadow-sm transition dark:bg-brand-light/[0.055] md:p-6',
                plan.apiAccess
                    ? 'border-brand-mint/30 shadow-brand-mint/5'
                    : 'border-brand-light/70 dark:border-brand-light/12',
                isCurrent ? 'ring-2 ring-brand-mint/35' : 'hover:-translate-y-0.5 hover:border-brand-mint/45 hover:shadow-lg hover:shadow-brand-navy/10',
            )}
        >
            <div className="flex flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="mr-auto text-2xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{plan.name}</h3>
                    {isCurrent ? (
                        <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-mint">
                            Current
                        </span>
                    ) : null}
                    {plan.apiAccess ? (
                        <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-mint">
                            API ready
                        </span>
                    ) : null}
                </div>

                <div className="mt-7 flex items-end gap-2">
                    <span className="pb-4 text-lg font-semibold text-brand-slate dark:text-brand-light/60">{price.symbol}</span>
                    <span className="text-5xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{price.amount}</span>
                    <span className="pb-2 text-sm font-semibold text-brand-slate dark:text-brand-light/70">{periodLabel}</span>
                </div>
                <p className="mt-5 min-h-[2.75rem] text-base font-semibold leading-6 text-brand-navy dark:text-brand-light">{planIntro}</p>

                {!plan.canSubscribe ? (
                    <div className="mt-6 flex h-12 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 text-sm font-semibold text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/6 dark:text-brand-light/70">
                        Contact support
                    </div>
                ) : (
                    <button
                        type="button"
                        disabled={isCurrent || isCheckingOut}
                        onClick={() => onCheckout(plan.id)}
                        className={clsx(
                            'mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed',
                            isCurrent
                                ? 'border border-brand-light/70 bg-brand-light/70 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/8 dark:text-brand-light/55'
                                : 'bg-brand-mint text-brand-light shadow-sm hover:bg-brand-mint/90',
                        )}
                    >
                        <CreditCard size={16} />
                        {isCurrent ? 'Current plan' : isCheckingOut ? 'Opening checkout...' : actionLabel}
                        {!isCurrent && !isCheckingOut ? <ArrowRight size={16} /> : null}
                    </button>
                )}

                <div className="mt-6 space-y-3.5">
                    <PlanFeatureRow icon={Hotel}>{plan.maxHotels} hotel{plan.maxHotels === 1 ? '' : 's'}</PlanFeatureRow>
                    <PlanFeatureRow icon={Users}>{plan.maxUsers} team seat{plan.maxUsers === 1 ? '' : 's'}</PlanFeatureRow>
                    <PlanFeatureRow icon={plan.apiAccess ? KeyRound : LockKeyhole}>
                        {plan.apiAccess ? 'API access included' : 'API access not included'}
                    </PlanFeatureRow>
                    <PlanFeatureRow icon={ShieldCheck}>{plan.supportTier} support</PlanFeatureRow>
                    <PlanFeatureRow icon={CreditCard}>{billingTypeLabel(plan.billingType)}</PlanFeatureRow>
                    {visibleFeatures.map((feature) => (
                        <PlanFeatureRow key={feature} icon={CheckCircle2}>{feature}</PlanFeatureRow>
                    ))}
                </div>
            </div>
        </article>
    );
}

function OrganizationSetupPanel({ onCreated }: { onCreated: (tenantId: number | null) => void }) {
    const [organizationName, setOrganizationName] = useState('');
    const setupOrganization = useSetupOrganization((result) => {
        onCreated(result.user.tenantId);
        setOrganizationName('');
    });
    const canSubmit = organizationName.trim().length > 0 && !setupOrganization.isPending;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) return;
        setupOrganization.mutate({ organizationName: organizationName.trim() });
    };

    return (
        <div id="organization-setup" className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5 dark:bg-amber-400/8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500 dark:text-amber-200">
                        <Building2 size={18} />
                    </span>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200">Account setup</p>
                    <h3 className="mt-2 text-xl font-semibold text-brand-navy dark:text-brand-light">Organization setup required</h3>
                    <p className="mt-2 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                        Your account is not linked to an organization yet. Create your organization profile before choosing a plan.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-brand-light/70 bg-brand-light/70 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
                    <TextInput
                        label="Organization name"
                        value={organizationName}
                        onChange={setOrganizationName}
                        autoComplete="organization"
                    />
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-mint px-5 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Building2 size={16} />
                        {setupOrganization.isPending ? 'Creating organization...' : 'Create organization'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function PlanUsagePanel({ profile }: { profile: CurrentProfile }) {
    const { data: usage, isLoading, isError } = useTenantUsage();
    const { syncUserProfile } = useAuth();
    const [isPlanPickerOpen, setIsPlanPickerOpen] = useState(false);
    const { data: plans = [], isLoading: plansLoading } = useAvailablePlans();
    const checkout = useCreateTenantCheckoutSession();
    const syncCheckout = useSyncTenantCheckoutSession();
    const hasProfileTenant = Boolean(profile.tenant?.id);
    const [showPaymentSync, setShowPaymentSync] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.location.hash === '#plan-usage' && hasProfileTenant && usage?.hasTenant !== false) {
            setIsPlanPickerOpen(true);
        }
    }, [hasProfileTenant, usage?.hasTenant]);

    if (isLoading) {
        return <div className="h-32 animate-pulse rounded-2xl bg-brand-slate/10 dark:bg-brand-light/10" />;
    }

    if (isError || !usage) {
        return <p className="text-sm text-brand-slate dark:text-brand-light/70">Subscription usage is not available yet.</p>;
    }

    const isAdmin = profile.role === 'ADMIN';
    const hasTenant = usage.hasTenant !== false && hasProfileTenant;
    if (!hasTenant) {
        if (isAdmin) {
            return <OrganizationSetupPanel onCreated={(tenantId) => syncUserProfile({ tenantId })} />;
        }

        return (
            <div className="rounded-2xl border border-brand-coral/25 bg-brand-coral/10 p-5 text-sm font-semibold text-brand-coral">
                Your account is not linked to an organization. Contact an administrator.
            </div>
        );
    }

    const canManageBilling = isAdmin;
    const checkoutPlanId = checkout.variables;
    const currentPlanId = usage.plan?.id;
    const isPaymentRequired = usage.billingStatus === 'PAST_DUE';
    const isBillingSuspended = usage.billingStatus === 'SUSPENDED';
    const canRecoverBilling = canManageBilling && Boolean(currentPlanId) && (isPaymentRequired || isBillingSuspended);
    const tenantIsSuspended = profile.tenant?.isActive === false;

    const handleCheckoutResult = (result: TenantCheckoutSession) => {
        if (result.checkoutUrl) {
            window.location.assign(result.checkoutUrl);
            return;
        }

        if (result.billingStatus === 'ACTIVE' || result.alreadyProcessed) {
            setShowPaymentSync(false);
            toast.success(result.message || 'Payment confirmed. Billing is now active.');
            return;
        }

        setShowPaymentSync(true);
        toast.error(result.message || 'Payment is not confirmed yet. You can check payment status again in a moment.');
    };

    const startCheckout = (planId: number) => {
        checkout.mutate(planId, {
            onSuccess: handleCheckoutResult,
            onError: (error) => {
                const message = checkoutErrorMessage(error);
                if (message.includes('previous checkout has already completed')) {
                    setShowPaymentSync(true);
                }
            },
        });
    };

    const checkPaymentStatus = () => {
        syncCheckout.mutate(undefined, {
            onSuccess: (result) => {
                if (result.billingStatus === 'ACTIVE' || result.resolved) {
                    setShowPaymentSync(false);
                    toast.success(result.message || 'Payment confirmed. Billing is now active.');
                    return;
                }

                setShowPaymentSync(true);
                toast.error(result.message || 'Still waiting for Stripe confirmation.');
            },
        });
    };

    return (
        <div className="space-y-5" id="plan-usage">
            {!usage.hasPlan ? (
                <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm font-semibold text-amber-700 dark:text-amber-200">
                    No plan is assigned to this organization. Some features are unavailable.
                </div>
            ) : null}
            {usage.hasPlan && !usage.canUseApiAccess ? (
                <div className="rounded-2xl border border-brand-coral/25 bg-brand-coral/10 p-4 text-sm font-semibold text-brand-coral">
                    API access is not included in your current active plan.
                </div>
            ) : null}
            {isPaymentRequired ? (
                <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-800 dark:text-amber-200">
                    <p className="font-semibold">Payment required</p>
                    <p>Your plan is selected, but payment has not been confirmed yet. Complete payment to activate billing and entitlements.</p>
                </div>
            ) : null}
            {isBillingSuspended ? (
                <div className="rounded-2xl border border-brand-coral/25 bg-brand-coral/10 p-4 text-sm leading-6 text-brand-coral">
                    <p className="font-semibold">Billing suspended</p>
                    <p>Restore billing through Stripe before entitlements can be enabled again.</p>
                </div>
            ) : null}
            {tenantIsSuspended ? (
                <div className="rounded-2xl border border-brand-slate/20 bg-brand-slate/8 p-4 text-sm leading-6 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                    Payment may restore billing, but platform access requires supervisor reactivation.
                </div>
            ) : null}
            {showPaymentSync ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-800 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold">A previous checkout was completed and is being confirmed.</p>
                        <p>Use payment status sync if the webhook was delayed or your local Stripe listener was not running.</p>
                    </div>
                    <button
                        type="button"
                        onClick={checkPaymentStatus}
                        disabled={syncCheckout.isPending}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {syncCheckout.isPending ? 'Checking...' : 'Check payment status'}
                    </button>
                </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
                <DetailTile label="Current plan" value={usage.planName || 'Unassigned'} icon={BadgeCheck} />
                <DetailTile label="Billing status" value={billingStatusLabel(usage.billingStatus)} icon={ShieldCheck} />
                <DetailTile label="Seats used" value={`${formatUsageNumber(usage.users.used)} / ${formatLimit(usage.users.limit)}`} icon={Users} />
                <DetailTile label="Pending invites" value={formatUsageNumber(usage.users.pendingInvites)} icon={Mail} />
                <DetailTile label="Hotels used" value={`${formatUsageNumber(usage.hotels.used)} / ${formatLimit(usage.hotels.limit)}`} icon={Hotel} />
                <DetailTile label="API access" value={usage.canUseApiAccess ? 'Enabled' : 'Disabled'} icon={KeyRound} />
                <DetailTile label="Billing type" value={usage.plan?.billingType ? usage.plan.billingType.replace('_', ' ') : 'Not assigned'} icon={CreditCard} />
                <DetailTile label="Support tier" value={usage.plan?.supportTier ?? 'Not assigned'} icon={CheckCircle2} />
            </div>

            {canManageBilling ? (
                <div className="flex flex-wrap items-center gap-3">
                    {canRecoverBilling && currentPlanId ? (
                        <button
                            type="button"
                            onClick={() => startCheckout(currentPlanId)}
                            disabled={checkout.isPending && checkoutPlanId === currentPlanId}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-mint px-5 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <CreditCard size={16} />
                            {checkout.isPending && checkoutPlanId === currentPlanId
                                ? 'Opening checkout...'
                                : isBillingSuspended
                                    ? 'Restore billing'
                                    : 'Complete payment'}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => setIsPlanPickerOpen(true)}
                        className={clsx(
                            'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm transition',
                            canRecoverBilling
                                ? 'border border-brand-light/70 bg-brand-light/70 text-brand-navy hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light'
                                : 'bg-brand-mint text-brand-light hover:bg-brand-mint/90',
                        )}
                    >
                        <CreditCard size={16} />
                        {usage.hasPlan ? 'Change plan' : 'Choose a plan'}
                    </button>
                    <span className="text-sm text-brand-slate dark:text-brand-light/65">
                        Checkout opens through Stripe. Billing and entitlements update after webhook confirmation.
                    </span>
                </div>
            ) : (
                <p className="text-sm font-semibold text-brand-slate dark:text-brand-light/70">
                    Ask your administrator to upgrade the plan.
                </p>
            )}

            {canManageBilling ? (
                <ModalShell
                    isOpen={isPlanPickerOpen}
                    onClose={() => setIsPlanPickerOpen(false)}
                    title={usage.hasPlan ? 'Upgrade plan' : 'Choose a plan'}
                    subtitle="Plan options"
                    icon={<CreditCard size={18} />}
                    maxWidth="max-w-5xl"
                    footer={(
                        <button
                            type="button"
                            onClick={() => setIsPlanPickerOpen(false)}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-4 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        >
                            Close
                        </button>
                    )}
                >
                    <div className="p-5 md:p-6">
                        {plansLoading ? (
                            <div className="h-48 animate-pulse rounded-2xl bg-brand-slate/10 dark:bg-brand-light/10" />
                        ) : plans.length === 0 ? (
                            <div className="rounded-2xl border border-brand-light/70 bg-brand-light/55 p-5 text-sm font-semibold text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/70">
                                No active plans are available right now.
                            </div>
                        ) : (
                            <div className="grid gap-4 xl:grid-cols-2">
                                {plans.map((plan) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        isCurrent={usage.plan?.id === plan.id}
                                        isCheckingOut={checkout.isPending && checkoutPlanId === plan.id}
                                        actionLabel={planActionLabel(plan, usage.plan)}
                                        onCheckout={startCheckout}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </ModalShell>
            ) : null}
        </div>
    );
}

function CommercialWorkspacePanel({ profile }: { profile: CurrentProfile }) {
    const { t } = useTranslation('common');
    const { currentHotel, isLoading: isHotelLoading } = useHotel();
    const assignedHotel = profile.hotels?.[0]?.name ?? t('pages.profile.common.notAssigned', { defaultValue: 'Not assigned' });
    const recentIssuedFrom = useMemo(() => dateDaysAgo(30), []);

    const contractsQuery = useQuery<PaginatedResult<Contract>>({
        queryKey: ['profile', 'commercial-workspace', 'contracts', currentHotel?.id],
        queryFn: () => contractService.getContracts({ page: 1, limit: 100 }),
        enabled: Boolean(currentHotel?.id),
        staleTime: 60_000,
    });

    const proformasQuery = useQuery<PaginatedResult<ProformaInvoice>>({
        queryKey: ['profile', 'commercial-workspace', 'recent-proformas', currentHotel?.id, recentIssuedFrom],
        queryFn: async () => {
            const { data } = await apiClient.get<PaginatedResult<ProformaInvoice>>('/proforma/invoices', {
                params: { page: 1, limit: 1, issuedFrom: recentIssuedFrom },
            });
            return data;
        },
        enabled: Boolean(currentHotel?.id),
        staleTime: 60_000,
    });

    const activeSeason = useMemo(
        () => getCurrentSeasonWindow(contractsQuery.data?.data ?? []),
        [contractsQuery.data?.data],
    );

    const activeSeasonValue = isHotelLoading || contractsQuery.isLoading
        ? t('pages.profile.common.loading', { defaultValue: 'Loading...' })
        : contractsQuery.isError
            ? t('pages.profile.commercial.seasonsLoadError', { defaultValue: 'Could not load seasons' })
            : activeSeason
                ? t('pages.profile.commercial.activeSeasonValue', {
                    defaultValue: '{{label}} ({{count}} active contracts)',
                    label: activeSeason.label,
                    count: activeSeason.contractCount,
                })
                : t('pages.profile.commercial.noActiveSeason', { defaultValue: 'No active season' });

    const recentProformaCount = proformasQuery.data?.meta.total ?? 0;
    const recentSimulationsValue = isHotelLoading || proformasQuery.isLoading
        ? t('pages.profile.common.loading', { defaultValue: 'Loading...' })
        : proformasQuery.isError
            ? t('pages.profile.commercial.activityLoadError', { defaultValue: 'Could not load activity' })
            : recentProformaCount > 0
                ? t('pages.profile.commercial.recentProformas', {
                    defaultValue: '{{count}} issued proformas in 30 days',
                    count: recentProformaCount,
                })
                : t('pages.profile.commercial.noRecentProformas', { defaultValue: 'No issued proformas in 30 days' });

    return (
        <ProfileCard
            eyebrow={t('pages.profile.commercial.eyebrow', { defaultValue: 'Commercial workspace' })}
            title={t('pages.profile.commercial.title', { defaultValue: 'Assigned work area' })}
            description={t('pages.profile.commercial.description', { defaultValue: 'Your assigned hotel and shortcuts for the commercial workspace.' })}
        >
            <div className="grid gap-3 md:grid-cols-3">
                <DetailTile label={t('pages.profile.fields.assignedHotel', { defaultValue: 'Assigned hotel' })} value={assignedHotel} icon={Hotel} />
                <DetailTile label={t('pages.profile.commercial.activeSeason', { defaultValue: 'Active season' })} value={activeSeasonValue} icon={Briefcase} />
                <DetailTile label={t('pages.profile.commercial.recentSimulations', { defaultValue: 'Recent simulations' })} value={recentSimulationsValue} icon={Calculator} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <QuickAction to="/hotel-setup/hotel-information" label={t('pages.profile.quickActions.hotelProfile.label', { defaultValue: 'Hotel Information' })} description={t('pages.profile.quickActions.hotelProfile.description', { defaultValue: 'Check assigned hotel details.' })} icon={Hotel} />
                <QuickAction to="/product/rooms" label={t('pages.profile.quickActions.roomTypes.label', { defaultValue: 'Room Types' })} description={t('pages.profile.quickActions.roomTypes.description', { defaultValue: 'Review sellable room inventory.' })} icon={BedDouble} />
                <QuickAction to="/product/arrangements" label={t('pages.profile.quickActions.arrangements.label', { defaultValue: 'Arrangements' })} description={t('pages.profile.quickActions.arrangements.description', { defaultValue: 'Review hotel meal plans.' })} icon={Users} />
                <QuickAction to="/hotel-setup/exchange-rates" label={t('pages.profile.quickActions.exchangeRates.label', { defaultValue: 'Exchange Rates' })} description={t('pages.profile.quickActions.exchangeRates.description', { defaultValue: 'Review configured currency pairs.' })} icon={Calculator} />
            </div>
        </ProfileCard>
    );
}

function RoleSpecificSection({ profile }: { profile: CurrentProfile }) {
    const { t } = useTranslation('common');
    const assignedHotel = profile.hotels?.[0]?.name ?? t('pages.profile.common.notAssigned', { defaultValue: 'Not assigned' });

    if (profile.role === 'ADMIN') {
        return (
            <ProfileCard
                eyebrow={t('pages.profile.admin.eyebrow', { defaultValue: 'Admin controls' })}
                title={t('pages.profile.admin.title', { defaultValue: 'Organization access' })}
                description={t('pages.profile.admin.description', { defaultValue: 'Manage users and hotel information for the organization.' })}
            >
                <PlanUsagePanel profile={profile} />
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <QuickAction to="/admin/users" label={t('pages.profile.quickActions.manageUsers.label', { defaultValue: 'Manage users' })} description={t('pages.profile.quickActions.manageUsers.description', { defaultValue: 'Review users, pending invitations, and roles.' })} icon={UserCog} />
                    <QuickAction to="/admin/users" label={t('pages.profile.quickActions.inviteUsers.label', { defaultValue: 'Invite users' })} description={t('pages.profile.quickActions.inviteUsers.description', { defaultValue: 'Add team members with the right access.' })} icon={Users} />
                    <QuickAction to="/hotel-setup/hotel-information" label={t('pages.profile.quickActions.manageHotels.label', { defaultValue: 'Manage hotels' })} description={t('pages.profile.quickActions.manageHotels.description', { defaultValue: 'Maintain hotel information and portfolio details.' })} icon={Hotel} />
                    <QuickAction to="/hotel-setup/exchange-rates" label={t('pages.profile.quickActions.exchangeRates.label', { defaultValue: 'Exchange Rates' })} description={t('pages.profile.quickActions.exchangeRates.description', { defaultValue: 'Review configured currency pairs.' })} icon={Building2} />
                </div>
            </ProfileCard>
        );
    }

    if (profile.role === 'COMMERCIAL') {
        return <CommercialWorkspacePanel profile={profile} />;
    }

    return (
        <ProfileCard
            eyebrow={t('pages.profile.agent.eyebrow', { defaultValue: 'Agent access' })}
            title={t('pages.profile.agent.title', { defaultValue: 'Permissions and modules' })}
            description={t('pages.profile.agent.description', { defaultValue: 'This role is focused on the tools available to operational users.' })}
        >
            <div className="grid gap-3 md:grid-cols-3">
                <DetailTile label={t('pages.profile.fields.assignedHotel', { defaultValue: 'Assigned hotel' })} value={assignedHotel} icon={Hotel} />
                <DetailTile label={t('pages.profile.agent.accessibleModules', { defaultValue: 'Accessible modules' })} value={t('pages.profile.agent.pricingSimulator', { defaultValue: 'Pricing simulator' })} icon={Calculator} />
                <DetailTile label={t('pages.profile.agent.contractAccess', { defaultValue: 'Contract access' })} value={t('pages.profile.agent.limited', { defaultValue: 'Limited' })} icon={LockKeyhole} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
                <QuickAction to="/simulator" label={t('pages.profile.quickActions.openSimulator.label', { defaultValue: 'Open simulator' })} description={t('pages.profile.quickActions.openSimulator.description', { defaultValue: 'Run the pricing tool available to your role.' })} icon={Calculator} />
                <QuickAction to="/profile" label={t('pages.profile.quickActions.reviewProfile.label', { defaultValue: 'Review profile' })} description={t('pages.profile.quickActions.reviewProfile.description', { defaultValue: 'Keep your personal details current.' })} icon={UserCog} />
            </div>
        </ProfileCard>
    );
}

export default function ProfilePage() {
    const { t } = useTranslation('common');
    const { syncUserProfile } = useAuth();
    const { data: profile, isLoading, isError } = useCurrentProfile();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!profile) return;
        setFirstName(profile.firstName ?? '');
        setLastName(profile.lastName ?? '');
    }, [profile]);

    const updateProfile = useUpdateProfile((updatedProfile) => {
        syncUserProfile({
            firstName: updatedProfile.firstName ?? '',
            lastName: updatedProfile.lastName ?? '',
        });
    });
    const changePassword = useChangePassword(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    });

    const assignedHotels = useMemo(
        () => profile?.hotels?.map((hotel) => hotel.name).join(', ') || t('pages.profile.common.notAssigned', { defaultValue: 'Not assigned' }),
        [profile, t],
    );

    const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateProfile.mutate({ firstName, lastName });
    };

    const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) return;
        changePassword.mutate({ currentPassword, newPassword });
    };

    if (isLoading) {
        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="h-56 animate-pulse rounded-[2rem] bg-brand-slate/10 dark:bg-brand-light/10" />
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="h-72 animate-pulse rounded-2xl bg-brand-slate/10 dark:bg-brand-light/10" />
                    <div className="h-72 animate-pulse rounded-2xl bg-brand-slate/10 dark:bg-brand-light/10" />
                </div>
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-2xl border border-brand-coral/25 bg-brand-coral/10 p-6 text-sm text-brand-coral">
                    {t('pages.profile.errors.loadFailed', { defaultValue: 'Profile details could not be loaded right now.' })}
                </div>
            </div>
        );
    }

    const displayName = getDisplayName(profile, t('pages.profile.title', { defaultValue: 'Profile' }));
    const initials = getInitials(profile);
    const passwordMismatch = Boolean(newPassword && confirmPassword && newPassword !== confirmPassword);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <section className="relative overflow-hidden rounded-[2rem] border border-brand-light/70 bg-brand-light/82 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/6 dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)] md:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(57,217,138,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.07),transparent_44%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(57,217,138,0.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.75rem] bg-brand-mint/14 text-3xl font-bold text-brand-mint ring-1 ring-brand-mint/20">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-mint">{t('pages.profile.title', { defaultValue: 'Profile' })}</p>
                            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{displayName}</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{roleDescription(profile.role, t)}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-mint">{profile.role}</span>
                                <span className={clsx(
                                    'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]',
                                    profile.isActive
                                        ? 'border-brand-mint/25 bg-brand-mint/10 text-brand-mint'
                                        : 'border-brand-coral/25 bg-brand-coral/10 text-brand-coral',
                                )}>
                                    {statusLabel(profile)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[460px]">
                        <DetailTile label={t('pages.profile.fields.email', { defaultValue: 'Email' })} value={profile.email} icon={Mail} />
                        <DetailTile label={t('pages.profile.fields.organization', { defaultValue: 'Organization' })} value={profile.tenant?.name ?? t('pages.profile.common.notAvailable', { defaultValue: 'Not available' })} icon={Building2} />
                        <DetailTile label={t('pages.profile.fields.assignedHotel', { defaultValue: 'Assigned hotel' })} value={assignedHotels} icon={BedDouble} />
                        <DetailTile label={t('pages.profile.fields.joined', { defaultValue: 'Joined' })} value={t('pages.profile.common.notAvailableYet', { defaultValue: 'Not available yet' })} icon={BadgeCheck} />
                    </div>
                </div>
            </section>

            <RoleSpecificSection profile={profile} />

            <div className="grid gap-6 xl:grid-cols-2">
                <ProfileCard
                    eyebrow={t('pages.profile.personal.eyebrow', { defaultValue: 'Personal information' })}
                    title={t('pages.profile.personal.title', { defaultValue: 'Edit profile' })}
                    description={t('pages.profile.personal.description', { defaultValue: 'You can update your visible name. Email, role, organization, and hotel access are controlled by administrators.' })}
                >
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextInput label={t('pages.profile.fields.firstName', { defaultValue: 'First name' })} value={firstName} onChange={setFirstName} autoComplete="given-name" />
                            <TextInput label={t('pages.profile.fields.lastName', { defaultValue: 'Last name' })} value={lastName} onChange={setLastName} autoComplete="family-name" />
                        </div>
                        <button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-mint px-5 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {updateProfile.isPending
                                ? t('pages.profile.personal.saving', { defaultValue: 'Saving...' })
                                : t('pages.profile.personal.save', { defaultValue: 'Save profile' })}
                        </button>
                    </form>
                </ProfileCard>

                <ProfileCard
                    eyebrow={t('pages.profile.security.eyebrow', { defaultValue: 'Security' })}
                    title={t('pages.profile.security.title', { defaultValue: 'Change password' })}
                    description={t('pages.profile.security.description', { defaultValue: 'Use your current password to protect the account change.' })}
                >
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <TextInput label={t('pages.profile.security.currentPassword', { defaultValue: 'Current password' })} value={currentPassword} onChange={setCurrentPassword} type="password" autoComplete="current-password" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextInput label={t('pages.profile.security.newPassword', { defaultValue: 'New password' })} value={newPassword} onChange={setNewPassword} type="password" autoComplete="new-password" />
                            <TextInput label={t('pages.profile.security.confirmPassword', { defaultValue: 'Confirm password' })} value={confirmPassword} onChange={setConfirmPassword} type="password" autoComplete="new-password" />
                        </div>
                        {passwordMismatch ? <p className="text-sm font-semibold text-brand-coral">{t('pages.profile.security.passwordMismatch', { defaultValue: 'New password and confirmation do not match.' })}</p> : null}
                        <button
                            type="submit"
                            disabled={changePassword.isPending || passwordMismatch || !currentPassword || !newPassword}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-5 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        >
                            {changePassword.isPending
                                ? t('pages.profile.security.updating', { defaultValue: 'Updating...' })
                                : t('pages.profile.security.submit', { defaultValue: 'Change password' })}
                        </button>
                    </form>
                </ProfileCard>
            </div>
        </div>
    );
}
