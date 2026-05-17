import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
    ArrowRight,
    BadgeCheck,
    BedDouble,
    Briefcase,
    Building2,
    Calculator,
    CheckCircle2,
    CreditCard,
    FileText,
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
import ModalShell from '../../../components/ui/ModalShell';
import { useAvailablePlans, useChangePassword, useCreateTenantCheckoutSession, useCurrentProfile, useSetupOrganization, useUpdateProfile } from '../hooks/useProfile';
import type { AvailablePlan, CurrentProfile } from '../services/profile.service';

function getDisplayName(profile?: CurrentProfile | null): string {
    const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
    return name || profile?.email || 'Profile';
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

function roleDescription(role?: string): string {
    if (role === 'ADMIN') return 'Organization administrator with team, hotel, and plan visibility.';
    if (role === 'COMMERCIAL') return 'Commercial workspace user for contracts, pricing, partners, and simulation.';
    if (role === 'AGENT') return 'Limited tenant user focused on operational pricing tools.';
    return 'Platform user profile.';
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
    const hasProfileTenant = Boolean(profile.tenant?.id);

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

    const startCheckout = (planId: number) => {
        checkout.mutate(planId, {
            onSuccess: (session) => {
                window.location.assign(session.checkoutUrl);
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

            <div className="grid gap-3 md:grid-cols-2">
                <DetailTile label="Current plan" value={usage.planName || 'Unassigned'} icon={BadgeCheck} />
                <DetailTile label="Billing status" value={usage.billingStatus || 'Not linked'} icon={ShieldCheck} />
                <DetailTile label="Seats used" value={`${formatUsageNumber(usage.users.used)} / ${formatLimit(usage.users.limit)}`} icon={Users} />
                <DetailTile label="Pending invites" value={formatUsageNumber(usage.users.pendingInvites)} icon={Mail} />
                <DetailTile label="Hotels used" value={`${formatUsageNumber(usage.hotels.used)} / ${formatLimit(usage.hotels.limit)}`} icon={Hotel} />
                <DetailTile label="API access" value={usage.canUseApiAccess ? 'Enabled' : 'Disabled'} icon={KeyRound} />
                <DetailTile label="Billing type" value={usage.plan?.billingType ? usage.plan.billingType.replace('_', ' ') : 'Not assigned'} icon={CreditCard} />
                <DetailTile label="Support tier" value={usage.plan?.supportTier ?? 'Not assigned'} icon={CheckCircle2} />
            </div>

            {canManageBilling ? (
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsPlanPickerOpen(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-mint px-5 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90"
                    >
                        <CreditCard size={16} />
                        {usage.hasPlan ? 'Upgrade plan' : 'Choose a plan'}
                    </button>
                    <span className="text-sm text-brand-slate dark:text-brand-light/65">
                        Checkout opens through Stripe. New entitlements activate after payment confirmation.
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

function RoleSpecificSection({ profile }: { profile: CurrentProfile }) {
    const assignedHotel = profile.hotels?.[0]?.name ?? 'Not assigned';

    if (profile.role === 'ADMIN') {
        return (
            <ProfileCard
                eyebrow="Admin controls"
                title="Organization and plan"
                description="A focused view of the tenant limits that shape team and hotel management."
            >
                <PlanUsagePanel profile={profile} />
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <QuickAction to="/admin/users" label="Manage users" description="Review seats, pending invites, and roles." icon={UserCog} />
                    <QuickAction to="/admin/users" label="Invite users" description="Add team members within plan limits." icon={Users} />
                    <QuickAction to="/hotel-setup/hotel-information" label="Manage hotels" description="Maintain hotel profile and portfolio details." icon={Hotel} />
                    <QuickAction to="/organization" label="View usage" description="Open the organization overview." icon={Building2} />
                </div>
            </ProfileCard>
        );
    }

    if (profile.role === 'COMMERCIAL') {
        return (
            <ProfileCard
                eyebrow="Commercial workspace"
                title="Assigned work area"
                description="Your assigned hotel and shortcuts for the commercial workspace."
            >
                <div className="grid gap-3 md:grid-cols-3">
                    <DetailTile label="Assigned hotel" value={assignedHotel} icon={Hotel} />
                    <DetailTile label="Active season" value="Not available yet" icon={Briefcase} />
                    <DetailTile label="Recent simulations" value="Not available yet" icon={Calculator} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <QuickAction to="/contracts" label="View contracts" description="Open commercial agreements." icon={FileText} />
                    <QuickAction to="/simulator" label="Pricing simulation" description="Run operational price checks." icon={Calculator} />
                    <QuickAction to="/partners/affiliates" label="Affiliates" description="Review partner distribution." icon={Users} />
                    <QuickAction to="/hotel-setup/hotel-information" label="Hotel profile" description="Check assigned hotel details." icon={Hotel} />
                </div>
            </ProfileCard>
        );
    }

    return (
        <ProfileCard
            eyebrow="Agent access"
            title="Permissions and modules"
            description="This role is intentionally compact and focused on the tools available to operational users."
        >
            <div className="grid gap-3 md:grid-cols-3">
                <DetailTile label="Assigned hotel" value={assignedHotel} icon={Hotel} />
                <DetailTile label="Accessible modules" value="Pricing simulator" icon={Calculator} />
                <DetailTile label="Contract access" value="Limited" icon={LockKeyhole} />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
                <QuickAction to="/simulator" label="Open simulator" description="Run the pricing tool available to your role." icon={Calculator} />
                <QuickAction to="/profile" label="Review profile" description="Keep your personal details current." icon={UserCog} />
            </div>
        </ProfileCard>
    );
}

export default function ProfilePage() {
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

    const assignedHotels = useMemo(() => profile?.hotels?.map((hotel) => hotel.name).join(', ') || 'Not assigned', [profile]);

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
                    Profile details could not be loaded right now.
                </div>
            </div>
        );
    }

    const displayName = getDisplayName(profile);
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
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-mint">Profile</p>
                            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{displayName}</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">{roleDescription(profile.role)}</p>
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
                        <DetailTile label="Email" value={profile.email} icon={Mail} />
                        <DetailTile label="Organization" value={profile.tenant?.name ?? 'Not available'} icon={Building2} />
                        <DetailTile label="Assigned hotel" value={assignedHotels} icon={BedDouble} />
                        <DetailTile label="Joined" value="Not available yet" icon={BadgeCheck} />
                    </div>
                </div>
            </section>

            <RoleSpecificSection profile={profile} />

            <div className="grid gap-6 xl:grid-cols-2">
                <ProfileCard eyebrow="Personal information" title="Edit profile" description="You can update your visible name. Email, role, tenant, and hotel access are controlled by administrators.">
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextInput label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
                            <TextInput label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" />
                        </div>
                        <button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-mint px-5 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {updateProfile.isPending ? 'Saving...' : 'Save profile'}
                        </button>
                    </form>
                </ProfileCard>

                <ProfileCard eyebrow="Security" title="Change password" description="Use your current password to protect the account change.">
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <TextInput label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" autoComplete="current-password" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <TextInput label="New password" value={newPassword} onChange={setNewPassword} type="password" autoComplete="new-password" />
                            <TextInput label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} type="password" autoComplete="new-password" />
                        </div>
                        {passwordMismatch ? <p className="text-sm font-semibold text-brand-coral">New password and confirmation do not match.</p> : null}
                        <button
                            type="submit"
                            disabled={changePassword.isPending || passwordMismatch || !currentPassword || !newPassword}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-5 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                        >
                            {changePassword.isPending ? 'Updating...' : 'Change password'}
                        </button>
                    </form>
                </ProfileCard>
            </div>
        </div>
    );
}
