import { Building2, CheckCircle2, Clock3, CreditCard, Globe2, MoreHorizontal, Pencil, Power, PowerOff, TimerReset, TriangleAlert, Users, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useConfirm } from '../../../context/ConfirmContext';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { SupervisorPageHeader } from '../components/SupervisorPageHeader';
import { SupervisorSectionCard } from '../components/SupervisorSectionCard';
import { SupervisorDataTable, type SupervisorTableColumn } from '../components/SupervisorDataTable';
import {
    useCreateSupervisorCheckoutSession,
    useAssignSupervisorTenantPlan,
    useReactivateSupervisorTenant,
    useSupervisorPublicSignups,
    useSupervisorPlans,
    useSupervisorSubscriptions,
    useSupervisorTenants,
    useSuspendSupervisorTenant,
    type SupervisorPublicSignup,
    type SupervisorSubscription,
    type SupervisorTenant,
} from '../hooks/useSupervisor';

interface TenantTableRow {
    id: number;
    name: string;
    plan: string;
    billingTypeLabel: string;
    footprint: string;
    userCount: string;
    scope: string;
    revenue: string;
    revenueDetail: string;
    accessStatus: string;
    operationalStatus: string;
    isActive: boolean;
    planId?: number;
    subscriptionStatus?: SupervisorSubscription['status'];
    hasStripePrice?: boolean;
    planIsActive?: boolean;
}

interface PlanAssignmentState {
    tenant: TenantTableRow;
    planId: string;
}

interface TenantActionItem {
    label: string;
    description?: string;
    title?: string;
    icon: ReactNode;
    disabled?: boolean;
    tone?: 'default' | 'danger';
    onClick: () => void;
}

function formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function mapAccessStatus(subscription?: SupervisorSubscription): string {
    if (!subscription) return 'No plan';
    if (subscription.status === 'ACTIVE') return 'Active access';
    if (subscription.status === 'PAST_DUE') return 'Payment required';
    return 'Suspended';
}

function accessStatusClass(status: string): string {
    if (status === 'Active access') return 'border-brand-mint/20 bg-brand-mint/10 text-brand-mint';
    if (status === 'Payment required') return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200';
    if (status === 'Suspended') return 'border-red-200 bg-red-100 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300';
    return 'border-brand-slate/20 bg-brand-slate/8 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/10 dark:text-brand-light/75';
}

function tenantBillingTypeLabel(subscription?: SupervisorSubscription): string {
    if (!subscription) return 'No plan';
    return subscription.billingType === 'ONE_TIME' ? 'One-time' : 'Monthly';
}

function tenantRevenue(subscription?: SupervisorSubscription): { value: string; detail: string } {
    if (!subscription) {
        return { value: 'No revenue', detail: 'No subscription record' };
    }

    if (subscription.billingType === 'ONE_TIME') {
        return {
            value: `One-time ${formatMoney(subscription.oneTimeRevenue ?? 0, subscription.currency)}`,
            detail: 'No recurring MRR',
        };
    }

    return {
        value: `MRR ${formatMoney(subscription.monthlyRecurringRevenue, subscription.currency)}`,
        detail: 'Recurring subscription',
    };
}

function formatDate(value?: string | null): string {
    if (!value) return 'Not completed';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}

function formatSignupStatus(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function publicSignupIssues(signup: SupervisorPublicSignup): string[] {
    if (signup.provisioningIssues?.length) return signup.provisioningIssues;
    if (signup.status !== 'COMPLETED') return [];

    const issues: string[] = [];
    if (!signup.tenant) issues.push('Tenant was not linked.');
    if (!signup.adminUser) issues.push('Admin invite was not linked.');
    if (!signup.subscription) issues.push('Subscription was not linked.');
    return issues;
}

function publicSignupStatusLabel(signup: SupervisorPublicSignup): string {
    if (signup.provisioningState === 'PROVISIONED') return 'Provisioned';
    if (signup.provisioningState === 'INCOMPLETE') return 'Needs review';
    if (signup.provisioningState === 'PAYMENT_RECEIVED') return 'Payment received';
    if (signup.provisioningState === 'FAILED') return 'Failed';
    if (signup.provisioningState === 'EXPIRED') return 'Expired';
    if (signup.provisioningState === 'AWAITING_PAYMENT') return 'Awaiting payment';

    const issues = publicSignupIssues(signup);
    if (signup.status === 'COMPLETED') return issues.length > 0 ? 'Needs review' : 'Provisioned';
    if (signup.status === 'FAILED') return 'Failed';
    if (signup.status === 'EXPIRED') return 'Expired';
    if (signup.status === 'PAID') return 'Payment received';
    return 'Awaiting payment';
}

function publicSignupStatusClass(signup: SupervisorPublicSignup): string {
    const label = publicSignupStatusLabel(signup);
    if (label === 'Provisioned') return 'border-brand-mint/20 bg-brand-mint/10 text-brand-mint';
    if (label === 'Needs review') return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200';
    if (label === 'Failed') return 'border-red-200 bg-red-100 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300';
    if (label === 'Expired') return 'border-brand-slate/20 bg-brand-slate/8 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/10 dark:text-brand-light/75';
    return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200';
}

function publicSignupWarnings(signup: SupervisorPublicSignup): string[] {
    if (signup.provisioningWarnings?.length) return signup.provisioningWarnings;
    if (signup.status === 'COMPLETED' && !signup.completedAt) return ['Completion timestamp missing'];
    return [];
}

function referenceValue(value: string | null | undefined): string {
    return value?.trim() || 'Pending';
}

function getManualCheckoutState(tenant: TenantTableRow) {
    if (!tenant.planId) {
        return {
            label: 'Assign a plan first',
            disabled: true,
            title: 'Manual checkout requires an assigned subscription plan.',
        };
    }
    if (tenant.subscriptionStatus === 'ACTIVE') {
        return {
            label: 'Billing active',
            disabled: true,
            title: 'This tenant already has active billing for this plan.',
        };
    }
    if (tenant.planIsActive === false) {
        return {
            label: 'Plan inactive',
            disabled: true,
            title: 'Manual checkout requires an active plan.',
        };
    }
    if (tenant.hasStripePrice === undefined) {
        return {
            label: 'Checking plan',
            disabled: true,
            title: 'Plan billing configuration is still loading.',
        };
    }
    if (tenant.hasStripePrice === false) {
        return {
            label: 'Stripe Price ID missing',
            disabled: true,
            title: 'Add a Stripe Price ID to the plan before creating a manual checkout session.',
        };
    }

    return {
        label: 'Manual checkout',
        disabled: false,
        title: 'Internal supervisor recovery action. Public customers should normally start from the landing page.',
    };
}

function formatPlanPrice(plan: { monthlyPrice: number; currency: string; billingType: string; name: string }): string {
    if (plan.monthlyPrice === 0 && plan.name.toLowerCase().includes('enterprise')) {
        return 'Custom';
    }

    const price = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: plan.currency,
        maximumFractionDigits: 0,
    }).format(plan.monthlyPrice);
    return plan.billingType === 'ONE_TIME' ? `${price} one-time` : `${price} / month`;
}

function LoadingPanel({ label = 'Loading supervisor tenants...' }: { label?: string }) {
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

function TenantActionMenu({ actions }: { actions: TenantActionItem[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                menuRef.current &&
                !menuRef.current.contains(target) &&
                triggerRef.current &&
                !triggerRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        const handleViewportChange = () => setIsOpen(false);

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [isOpen]);

    const calculateMenuPosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const menuWidth = 288;
        const estimatedMenuHeight = Math.min(360, 56 + actions.length * 68);
        const viewportPadding = 12;
        const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
        const shouldOpenUp = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;
        const top = shouldOpenUp
            ? Math.max(viewportPadding, rect.top - estimatedMenuHeight - 8)
            : Math.min(rect.bottom + 8, window.innerHeight - estimatedMenuHeight - viewportPadding);
        const left = Math.min(
            Math.max(viewportPadding, rect.right - menuWidth),
            window.innerWidth - menuWidth - viewportPadding,
        );

        setMenuPosition({ top, left });
    };

    const toggleMenu = () => {
        if (!isOpen) {
            calculateMenuPosition();
        }
        setIsOpen((current) => !current);
    };

    return (
        <div className="relative flex justify-end">
            <button
                ref={triggerRef}
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-slate/15 bg-white/70 text-brand-slate shadow-sm transition hover:border-brand-mint/40 hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-mint/30 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                aria-label="Open tenant actions"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                title="Actions"
                onClick={toggleMenu}
            >
                <MoreHorizontal size={18} />
            </button>

            {isOpen ? createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                    className="fixed z-[1000] max-h-[calc(100vh-24px)] w-72 overflow-y-auto rounded-2xl border border-brand-slate/15 bg-white text-left shadow-2xl shadow-brand-navy/15 dark:border-brand-light/10 dark:bg-brand-navy dark:shadow-black/30"
                >
                    <div className="border-b border-brand-slate/12 px-4 py-3 dark:border-brand-light/10">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/60">Tenant actions</p>
                    </div>
                    <div className="p-1.5">
                        {actions.map((action) => (
                            <button
                                key={action.label}
                                type="button"
                                role="menuitem"
                                disabled={action.disabled}
                                title={action.title}
                                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    action.tone === 'danger'
                                        ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10'
                                        : 'text-brand-navy hover:bg-brand-mint/10 dark:text-brand-light dark:hover:bg-brand-light/10'
                                }`}
                                onClick={() => {
                                    if (action.disabled) return;
                                    setIsOpen(false);
                                    action.onClick();
                                }}
                            >
                                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-slate/8 text-brand-slate dark:bg-brand-light/10 dark:text-brand-light/75">
                                    {action.icon}
                                </span>
                                <span>
                                    <span className="block font-semibold">{action.label}</span>
                                    {action.description ? (
                                        <span className="mt-0.5 block text-xs leading-5 text-brand-slate dark:text-brand-light/60">{action.description}</span>
                                    ) : null}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body,
            ) : null}
        </div>
    );
}

export default function SupervisorTenantsPage() {
    const { t } = useTranslation('common');
    const { confirm } = useConfirm();
    const tenantsQuery = useSupervisorTenants();
    const plansQuery = useSupervisorPlans();
    const subscriptionsQuery = useSupervisorSubscriptions();
    const publicSignupsQuery = useSupervisorPublicSignups({ limit: 50 });
    const assignPlanMutation = useAssignSupervisorTenantPlan(() => setPlanAssignment(null));
    const reactivateTenantMutation = useReactivateSupervisorTenant();
    const suspendTenantMutation = useSuspendSupervisorTenant();
    const checkoutMutation = useCreateSupervisorCheckoutSession();
    const [planAssignment, setPlanAssignment] = useState<PlanAssignmentState | null>(null);

    const tenants = tenantsQuery.data ?? [];
    const plans = plansQuery.data ?? [];
    const subscriptions = subscriptionsQuery.data ?? [];
    const publicSignups = publicSignupsQuery.data ?? [];
    const plansById = useMemo(() => {
        return new Map(plans.map((plan) => [plan.id, plan]));
    }, [plans]);
    const subscriptionsByTenantId = useMemo(() => {
        return new Map(subscriptions.map((subscription) => [subscription.tenantId, subscription]));
    }, [subscriptions]);

    const tenantRows = useMemo<TenantTableRow[]>(() => {
        return tenants.map((tenant: SupervisorTenant) => {
            const subscription = subscriptionsByTenantId.get(tenant.id);
            const plan = subscription?.planId ? plansById.get(subscription.planId) : undefined;
            const revenue = tenantRevenue(subscription);
            return {
                id: tenant.id,
                name: tenant.name,
                planId: subscription?.planId,
                plan: subscription?.planName ?? 'Unassigned',
                billingTypeLabel: tenantBillingTypeLabel(subscription),
                subscriptionStatus: subscription?.status,
                hasStripePrice: plan ? Boolean(plan.stripePriceId) : subscription?.planId ? undefined : false,
                planIsActive: plan?.isActive,
                footprint: subscription ? `${subscription.hotelUsage} hotels` : 'Not reported',
                userCount: subscription ? `${subscription.userUsage} tenant users` : 'No seat data',
                scope: 'Tenant organization',
                revenue: revenue.value,
                revenueDetail: revenue.detail,
                accessStatus: mapAccessStatus(subscription),
                operationalStatus: tenant.isActive ? 'Active' : 'Suspended',
                isActive: tenant.isActive,
            };
        });
    }, [plansById, subscriptionsByTenantId, tenants]);

    const activeTenants = tenantRows.filter((tenant) => tenant.isActive).length;
    const suspendedTenants = tenantRows.length - activeTenants;
    const totalUsers = subscriptions.reduce((total, subscription) => total + subscription.userUsage, 0);
    const totalHotels = subscriptions.reduce((total, subscription) => total + subscription.hotelUsage, 0);
    const watchlistCount = subscriptions.filter((subscription) => subscription.status !== 'ACTIVE').length + suspendedTenants;
    const signupCounts = useMemo(() => ({
        pending: publicSignups.filter((signup) => signup.status === 'PENDING_PAYMENT' || signup.status === 'PAID').length,
        completed: publicSignups.filter((signup) => signup.status === 'COMPLETED').length,
        failed: publicSignups.filter((signup) => signup.status === 'FAILED').length,
        expired: publicSignups.filter((signup) => signup.status === 'EXPIRED').length,
    }), [publicSignups]);

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

    const handleReactivateTenant = async (tenant: TenantTableRow) => {
        if (await confirm({
            title: `Reactivate ${tenant.name}?`,
            description: 'Reactivate this tenant organization? This restores platform access but does not automatically mark billing as paid.',
            confirmLabel: 'Reactivate',
            variant: 'info',
        })) {
            reactivateTenantMutation.mutate(tenant.id);
        }
    };

    const openPlanAssignment = (tenant: TenantTableRow) => {
        const firstActivePlanId = plans.find((plan) => plan.isActive)?.id;
        setPlanAssignment({
            tenant,
            planId: String(tenant.planId ?? firstActivePlanId ?? ''),
        });
    };

    const handleAssignPlan = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!planAssignment || !planAssignment.planId) return;

        assignPlanMutation.mutate({
            tenantId: planAssignment.tenant.id,
            planId: Number(planAssignment.planId),
            status: 'PAST_DUE',
        });
    };

    const handleCheckout = async (tenant: TenantTableRow) => {
        if (!tenant.planId) return;
        if (!(await confirm({
            title: 'Create manual Stripe Checkout session?',
            description: 'Create a manual Stripe Checkout session for this tenant to recover payment? Billing recovery is separate from platform reactivation.',
            confirmLabel: 'Manual checkout',
            variant: 'info',
        }))) {
            return;
        }

        checkoutMutation.mutate(
            { tenantId: tenant.id, planId: tenant.planId },
            {
                onSuccess: (session) => {
                    if (session.checkoutUrl) {
                        window.location.assign(session.checkoutUrl);
                    } else if (session.billingStatus === 'ACTIVE' || session.resolved) {
                        toast.success(session.message || 'Payment confirmed. Billing is now active.');
                    } else {
                        toast.error(session.message || 'A previous checkout completed and is being reconciled. Use payment sync or wait for webhook.');
                    }
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
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">Plan {tenant.plan}</p>
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{tenant.billingTypeLabel}</p>
                </div>
            ),
        },
        {
            key: 'footprint',
            label: 'Footprint',
            render: (tenant) => (
                <div className="text-brand-navy dark:text-brand-light">
                    <p>{tenant.footprint}</p>
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{tenant.userCount}</p>
                </div>
            ),
        },
        {
            key: 'scope',
            label: 'Scope',
            render: (tenant) => <span className="text-brand-slate dark:text-brand-light/75">{tenant.scope}</span>,
        },
        {
            key: 'revenue',
            label: 'Revenue',
            render: (tenant) => (
                <div>
                    <p className="font-semibold text-brand-navy dark:text-brand-light">{tenant.revenue}</p>
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{tenant.revenueDetail}</p>
                </div>
            ),
        },
        {
            key: 'accessStatus',
            label: 'Billing / access',
            render: (tenant) => (
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accessStatusClass(tenant.accessStatus)}`}>
                    {tenant.accessStatus}
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
            render: (tenant) => {
                const manualCheckout = getManualCheckoutState(tenant);
                const actions: TenantActionItem[] = [];

                if (!tenant.isActive) {
                    actions.push({
                        label: 'Reactivate',
                        description: 'Restore platform access without changing billing.',
                        icon: <Power size={16} />,
                        disabled: reactivateTenantMutation.isPending,
                        onClick: () => { void handleReactivateTenant(tenant); },
                    });
                }

                if (!tenant.planId) {
                    actions.push({
                        label: 'Assign plan',
                        description: 'Create local plan access as payment required.',
                        icon: <Pencil size={16} />,
                        onClick: () => openPlanAssignment(tenant),
                    });
                } else {
                    if (tenant.isActive || tenant.subscriptionStatus !== 'ACTIVE') {
                        actions.push({
                            label: manualCheckout.label,
                            description: manualCheckout.disabled
                                ? manualCheckout.title
                                : 'Create a manual Stripe recovery checkout.',
                            title: manualCheckout.title,
                            icon: <CreditCard size={16} />,
                            disabled: manualCheckout.disabled || checkoutMutation.isPending,
                            onClick: () => { void handleCheckout(tenant); },
                        });
                    }

                    actions.push({
                        label: 'Change plan',
                        description: 'Move this tenant to a different SaaS plan.',
                        icon: <Pencil size={16} />,
                        onClick: () => openPlanAssignment(tenant),
                    });
                }

                if (tenant.isActive) {
                    actions.push({
                        label: 'Suspend',
                        description: 'Disable tenant access at the platform layer.',
                        icon: <PowerOff size={16} />,
                        disabled: suspendTenantMutation.isPending,
                        tone: 'danger',
                        onClick: () => { void handleSuspendTenant(tenant); },
                    });
                }

                return <TenantActionMenu actions={actions} />;
            },
        },
    ];

    const publicSignupColumns: SupervisorTableColumn<SupervisorPublicSignup>[] = [
        {
            key: 'company',
            label: 'Company',
            render: (signup) => (
                <div>
                    <p className="font-semibold text-brand-navy dark:text-brand-light">{signup.companyName}</p>
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">Signup #{signup.id}</p>
                </div>
            ),
        },
        {
            key: 'admin',
            label: 'Admin contact',
            render: (signup) => (
                <div className="text-brand-navy dark:text-brand-light">
                    <p>{signup.adminFullName}</p>
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{signup.adminEmail}</p>
                    {signup.phone ? <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{signup.phone}</p> : null}
                </div>
            ),
        },
        {
            key: 'plan',
            label: 'Plan',
            render: (signup) => (
                <div>
                    <p className="font-semibold text-brand-navy dark:text-brand-light">{signup.planName}</p>
                    <p className="mt-1 text-xs text-brand-slate dark:text-brand-light/60">{signup.billingType === 'ONE_TIME' ? 'One-time payment' : 'Recurring subscription'}</p>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (signup) => {
                const issues = publicSignupIssues(signup);
                const warnings = publicSignupWarnings(signup);
                return (
                    <div className="space-y-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${publicSignupStatusClass(signup)}`}>
                            {publicSignupStatusLabel(signup)}
                        </span>
                        {signup.status !== 'COMPLETED' ? (
                            <p className="text-xs text-brand-slate dark:text-brand-light/60">{formatSignupStatus(signup.status)}</p>
                        ) : null}
                        {issues.length > 0 ? (
                            <p className="max-w-xs text-xs leading-5 text-amber-700 dark:text-amber-200">{issues[0]}</p>
                        ) : warnings.length > 0 ? (
                            <p className="max-w-xs text-xs leading-5 text-amber-700 dark:text-amber-200">{warnings[0]}</p>
                        ) : signup.failureReason ? (
                            <p className="max-w-xs text-xs leading-5 text-red-700 dark:text-red-300">{signup.failureReason}</p>
                        ) : null}
                    </div>
                );
            },
        },
        {
            key: 'timeline',
            label: 'Timeline',
            render: (signup) => (
                <div className="space-y-1 text-xs text-brand-slate dark:text-brand-light/75">
                    <p><span className="font-semibold text-brand-navy dark:text-brand-light">Submitted:</span> {formatDate(signup.createdAt)}</p>
                    <p>
                        <span className="font-semibold text-brand-navy dark:text-brand-light">Completed:</span>{' '}
                        {signup.completedAt
                            ? formatDate(signup.completedAt)
                            : signup.status === 'COMPLETED'
                                ? 'Timestamp missing'
                                : 'Not completed'}
                    </p>
                </div>
            ),
        },
        {
            key: 'provisioning',
            label: 'Provisioning',
            render: (signup) => (
                <div className="space-y-1 text-xs text-brand-slate dark:text-brand-light/75">
                    <p><span className="font-semibold text-brand-navy dark:text-brand-light">Tenant:</span> {referenceValue(signup.tenant?.name)}</p>
                    <p><span className="font-semibold text-brand-navy dark:text-brand-light">Admin invite:</span> {referenceValue(signup.adminUser?.email ?? signup.adminUser?.name)}</p>
                    <p>
                        <span className="font-semibold text-brand-navy dark:text-brand-light">Subscription:</span>{' '}
                        {signup.subscription
                            ? `${formatSignupStatus(signup.subscription.status)} - ${signup.subscription.planName}`
                            : 'Pending'}
                    </p>
                </div>
            ),
        },
        {
            key: 'details',
            label: 'Details',
            className: 'min-w-[220px]',
            render: (signup) => {
                const issues = publicSignupIssues(signup);
                const warnings = publicSignupWarnings(signup);
                return (
                    <details className="rounded-xl border border-brand-slate/15 bg-white/60 px-3 py-2 text-xs text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                        <summary className="cursor-pointer font-semibold text-brand-navy dark:text-brand-light">View details</summary>
                        <div className="mt-3 space-y-1.5">
                            <p>Signup ID: #{signup.id}</p>
                            <p>Tenant: {signup.tenant ? `${signup.tenant.name} (#${signup.tenant.id})` : 'Pending'}</p>
                            <p>Admin user: {signup.adminUser ? `${signup.adminUser.email} (#${signup.adminUser.id})` : 'Pending'}</p>
                            <p>Subscription: {signup.subscription ? `#${signup.subscription.id} - ${formatSignupStatus(signup.subscription.status)}` : 'Pending'}</p>
                            <p>Checkout: {signup.checkout?.sessionIdPreview ?? (signup.checkout?.hasSession ? 'Available' : 'None')}</p>
                            <p>Updated: {formatDate(signup.updatedAt)}</p>
                            {signup.failureReason ? <p className="text-red-700 dark:text-red-300">Failure: {signup.failureReason}</p> : null}
                            {issues.length > 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                                    {issues.map((issue) => <p key={issue}>{issue}</p>)}
                                </div>
                            ) : null}
                            {warnings.length > 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                                    {warnings.map((warning) => <p key={warning}>{warning}</p>)}
                                </div>
                            ) : null}
                        </div>
                    </details>
                );
            },
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
                    label={t('pages.supervisor.tenants.metrics.platformUsers.label', { defaultValue: 'Tenant Users' })}
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
                description={t('pages.supervisor.tenants.cards.organizationRoster.description', { defaultValue: 'Shows current tenant organizations, plan assignment, billing/access state, and recovery actions.' })}
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

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SupervisorMetricCard
                    label="Pending payment"
                    value={`${signupCounts.pending}`}
                    delta="Awaiting Stripe confirmation"
                    description="Submitted onboarding attempts that have not completed provisioning yet."
                    icon={Clock3}
                />
                <SupervisorMetricCard
                    label="Completed"
                    value={`${signupCounts.completed}`}
                    delta="Tenant provisioned"
                    description="Completed signup attempts with tenant, admin, and subscription references."
                    icon={CheckCircle2}
                />
                <SupervisorMetricCard
                    label="Failed"
                    value={`${signupCounts.failed}`}
                    delta="Needs review"
                    description="Stripe or provisioning failures with a stored failure reason."
                    icon={XCircle}
                    tone="amber"
                />
                <SupervisorMetricCard
                    label="Expired"
                    value={`${signupCounts.expired}`}
                    delta="Old checkout links"
                    description="Superseded or expired checkout attempts that did not provision an account."
                    icon={TimerReset}
                    tone="navy"
                />
            </section>

            <SupervisorSectionCard
                eyebrow={t('pages.supervisor.tenants.cards.publicSignups.eyebrow', { defaultValue: 'Public signups' })}
                title={t('pages.supervisor.tenants.cards.publicSignups.title', { defaultValue: 'Onboarding and payment attempts' })}
                description={t('pages.supervisor.tenants.cards.publicSignups.description', { defaultValue: 'Tracks public checkout attempts before and during provisioning. A completed signup may create a tenant, admin invite, and subscription.' })}
            >
                {publicSignupsQuery.isLoading ? (
                    <LoadingPanel label="Loading public signup attempts..." />
                ) : publicSignupsQuery.isError ? (
                    <EmptyPanel label="Unable to load public signup attempts from the supervisor API right now." />
                ) : publicSignups.length === 0 ? (
                    <EmptyPanel label="No public onboarding attempts have been recorded yet." />
                ) : (
                    <SupervisorDataTable
                        columns={publicSignupColumns}
                        rows={publicSignups}
                        rowKey={(signup) => String(signup.id)}
                    />
                )}
            </SupervisorSectionCard>

            <Modal
                isOpen={planAssignment !== null}
                onClose={() => setPlanAssignment(null)}
                title={planAssignment?.tenant.planId ? 'Change tenant plan' : 'Assign tenant plan'}
                maxWidth="max-w-xl"
            >
                <form className="space-y-5" onSubmit={handleAssignPlan}>
                    <div className="rounded-2xl border border-brand-slate/15 bg-white/70 px-4 py-4 text-sm leading-7 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5">
                        <p className="font-semibold text-brand-navy dark:text-brand-light">
                            {planAssignment?.tenant.name}
                        </p>
                        <p>Assigning a plan creates local billing/access state. It does not charge the tenant automatically.</p>
                        <p>Use Manual checkout after assignment if you need to collect payment.</p>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Plan</span>
                        <select
                            value={planAssignment?.planId ?? ''}
                            onChange={(event) => setPlanAssignment((current) => current ? { ...current, planId: event.target.value } : current)}
                            className="h-12 w-full rounded-2xl border border-brand-slate/30 bg-brand-light px-4 text-sm text-brand-navy shadow-sm outline-none focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-slate/50 dark:bg-brand-navy/80 dark:text-brand-light"
                            required
                        >
                            <option value="">Select an active plan</option>
                            {plans.filter((plan) => plan.isActive).map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} - {formatPlanPrice(plan)}
                                </option>
                            ))}
                        </select>
                    </label>

                    {(() => {
                        const selectedPlan = plans.find((plan) => String(plan.id) === planAssignment?.planId);
                        if (!selectedPlan) return null;

                        return (
                            <div className="rounded-2xl border border-brand-mint/20 bg-brand-mint/10 px-4 py-3 text-sm leading-6 text-brand-slate dark:border-brand-mint/25 dark:bg-brand-mint/10 dark:text-brand-light/75">
                                <p className="font-semibold text-brand-navy dark:text-brand-light">{selectedPlan.name}</p>
                                <p>{formatPlanPrice(selectedPlan)} - {selectedPlan.billingType === 'ONE_TIME' ? 'One-time payment' : 'Recurring subscription'}</p>
                                {!selectedPlan.stripePriceId ? (
                                    <p className="mt-2 text-amber-700 dark:text-amber-200">
                                        Manual checkout will remain unavailable until a Stripe Price ID is added.
                                    </p>
                                ) : null}
                            </div>
                        );
                    })()}

                    <div className="rounded-2xl border border-brand-slate/20 bg-brand-slate/10 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                        Default status: PAST_DUE / payment required.
                    </div>

                    <div className="flex justify-end gap-3 border-t border-brand-slate/15 pt-4 dark:border-brand-light/10">
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-11 rounded-2xl px-5"
                            onClick={() => setPlanAssignment(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="h-11 rounded-2xl px-5"
                            disabled={!planAssignment?.planId || assignPlanMutation.isPending}
                        >
                            {assignPlanMutation.isPending ? 'Assigning...' : 'Assign as payment required'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
