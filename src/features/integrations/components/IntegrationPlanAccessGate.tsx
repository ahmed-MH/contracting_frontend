import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, KeyRound, LockKeyhole, ServerCog, ShieldCheck } from 'lucide-react';
import { useTenantUsage } from '../../admin/hooks/useUsers';
import { useAuth } from '../../auth/context/AuthContext';
import { IntegrationDetailTile, IntegrationStatusBadge } from './IntegrationUi';

interface IntegrationPlanAccessGateProps {
    children: ReactNode;
}

export default function IntegrationPlanAccessGate({ children }: IntegrationPlanAccessGateProps) {
    const { data: usage, isLoading, isError, refetch } = useTenantUsage();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    if (isLoading) {
        return (
            <div className="min-w-0 space-y-6 p-4 md:p-6">
                <div className="flex min-h-[360px] items-center justify-center rounded-[2rem] border border-brand-light/70 bg-brand-light/82 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/6">
                    <div className="text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-mint border-t-transparent" />
                        <p className="mt-4 text-sm font-semibold text-brand-navy dark:text-brand-light">Checking plan access...</p>
                        <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/65">We are verifying whether integrations are included in this plan.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-w-0 space-y-6 p-4 md:p-6">
                <section className="rounded-[2rem] border border-amber-400/25 bg-amber-400/10 p-6 shadow-sm dark:bg-amber-400/8 md:p-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-500 dark:text-amber-300">
                                <AlertTriangle size={20} />
                            </span>
                            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-600 dark:text-amber-300">Entitlement check failed</p>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">We could not verify API access for this plan.</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                                Refresh the entitlement check before managing API users, keys, endpoint policy, or usage logs.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {isAdmin ? (
                                <Link
                                    to="/profile#plan-usage"
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-mint px-4 text-sm font-semibold text-brand-light transition hover:bg-brand-mint/90"
                                >
                                    View plan options
                                </Link>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => void refetch()}
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-4 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    if (usage?.canUseApiAccess !== true) {
        const hasTenant = usage?.hasTenant !== false;
        const hasPlan = usage?.hasPlan === true;
        const heading = !hasTenant
            ? 'Organization setup required'
            : hasPlan
            ? 'API access is not included in your current active plan.'
            : 'No plan is currently assigned to this organization.';
        const description = !hasTenant
            ? isAdmin
                ? 'Set up your organization profile before choosing a plan or using integrations.'
                : 'Your account is not linked to an organization. Contact your administrator.'
            : hasPlan
            ? 'Integrations are locked for this organization. API users, API keys, endpoint controls, playground requests, developer docs, and usage logs become available when API access is enabled on the active plan.'
            : 'Choose a plan with API access to unlock API users, keys, endpoint controls, playground requests, developer docs, and usage logs.';

        return (
            <div className="min-w-0 space-y-6 p-4 md:p-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-brand-light/70 bg-brand-light/82 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/6 dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)] md:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,92,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.07),transparent_44%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(244,114,92,0.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]" />
                    <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                        <div className="min-w-0">
                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-coral/12 text-brand-coral ring-1 ring-brand-coral/20">
                                <LockKeyhole size={22} />
                            </span>
                            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-coral">Plan restriction</p>
                            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                {heading}
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                                {description}
                            </p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <IntegrationDetailTile label="Current plan" value={usage?.planName ?? 'Unassigned'} tone="warning" />
                                <IntegrationDetailTile label="Billing status" value={usage?.billingStatus ?? 'Not linked'} tone="neutral" />
                                <IntegrationDetailTile label="API users and keys" value="Locked" tone="danger" />
                                <IntegrationDetailTile label="Public API usage" value="Blocked by plan" tone="danger" />
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                {isAdmin ? (
                                    <Link
                                        to={hasTenant ? '/profile#plan-usage' : '/profile#organization-setup'}
                                        className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-mint px-4 text-sm font-semibold text-brand-light transition hover:bg-brand-mint/90"
                                    >
                                        {hasTenant ? 'View plan options' : 'Set up organization'}
                                    </Link>
                                ) : (
                                    <Link
                                        to="/profile"
                                        className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-4 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                    >
                                        View profile
                                    </Link>
                                )}
                                <span className="text-sm text-brand-slate dark:text-brand-light/65">
                                    {isAdmin
                                        ? hasTenant
                                            ? 'Choose or upgrade a plan from your profile.'
                                            : 'Create your organization profile first.'
                                        : hasTenant
                                            ? 'Ask your administrator to upgrade the plan.'
                                            : 'Contact your administrator.'}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-brand-light/70 bg-brand-light/62 p-5 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">Locked surfaces</p>
                                    <p className="mt-2 text-lg font-semibold text-brand-navy dark:text-brand-light">Integration workspace</p>
                                </div>
                                <IntegrationStatusBadge tone="danger" label="Disabled" />
                            </div>
                            <div className="mt-5 space-y-3">
                                {[
                                    { icon: KeyRound, label: 'API users and keys' },
                                    { icon: ServerCog, label: 'Endpoint policy' },
                                    { icon: ShieldCheck, label: 'Playground, docs, and usage logs' },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/55 p-3 text-sm font-semibold text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-coral/10 text-brand-coral">
                                            <Icon size={17} />
                                        </span>
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return <>{children}</>;
}
