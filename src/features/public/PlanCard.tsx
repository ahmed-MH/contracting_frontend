import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import {
    ArrowRight,
    CheckCircle2,
    CreditCard,
    Hotel,
    KeyRound,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PublicPlan } from './services/publicPlans.service';

type PlanCardVariant = 'public' | 'compact' | 'selectable' | 'profile';

interface PlanCardProps {
    plan: PublicPlan;
    variant?: PlanCardVariant;
    isSelected?: boolean;
    isCurrent?: boolean;
    isPopular?: boolean;
    actionLabel?: string;
    actionDisabled?: boolean;
    actionTo?: string;
    onAction?: (plan: PublicPlan) => void;
}

function formatPlanPrice(plan: PublicPlan): string {
    if (plan.monthlyPrice === 0 && plan.name.toLowerCase().includes('enterprise')) {
        return 'Custom';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: plan.currency,
        maximumFractionDigits: 0,
    }).format(plan.monthlyPrice);
}

function formatBillingCadence(plan: PublicPlan): string {
    if (plan.monthlyPrice <= 0) return '';
    return plan.billingType === 'ONE_TIME' ? 'one-time' : '/month';
}

function billingTypeLabel(plan: PublicPlan): string {
    return plan.billingType === 'ONE_TIME' ? 'One-time payment' : 'Monthly subscription';
}

function formatLimit(value: number, singular: string, plural = `${singular}s`): string {
    return value >= 9999 ? `Unlimited ${plural}` : `${value} ${value === 1 ? singular : plural}`;
}

function PlanFeatureRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
    return (
        <div className="flex items-start gap-3 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
            <Icon className="mt-0.5 shrink-0 text-brand-mint" size={16} strokeWidth={1.9} />
            <span>{children}</span>
        </div>
    );
}

export function PlanCard({
    plan,
    variant = 'public',
    isSelected = false,
    isCurrent = false,
    isPopular = false,
    actionLabel,
    actionDisabled = false,
    actionTo,
    onAction,
}: PlanCardProps) {
    const isCompact = variant === 'compact' || variant === 'selectable';
    const isSelectable = variant === 'selectable';
    const visibleFeatures = plan.features.slice(0, isCompact || isSelectable ? 3 : 5);
    const price = formatPlanPrice(plan);
    const cadence = formatBillingCadence(plan);

    const content = (
        <>
            <div className="flex flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className={clsx('mr-auto font-semibold tracking-tight text-brand-navy dark:text-brand-light', isCompact ? 'text-xl' : 'text-2xl')}>
                        {plan.name}
                    </h3>
                    {isSelected ? (
                        <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-mint">
                            Selected
                        </span>
                    ) : null}
                    {isCurrent ? (
                        <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-mint">
                            Current
                        </span>
                    ) : null}
                    {isPopular ? (
                        <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-mint">
                            Popular
                        </span>
                    ) : null}
                </div>

                <div className={clsx('flex items-end gap-2', isCompact ? 'mt-5' : 'mt-7')}>
                    <span className={clsx('font-semibold tracking-tight text-brand-navy dark:text-brand-light', price === 'Custom' ? 'text-4xl' : isCompact ? 'text-4xl' : 'text-5xl')}>
                        {price}
                    </span>
                    {cadence ? <span className="pb-2 text-sm font-semibold text-brand-slate dark:text-brand-light/70">{cadence}</span> : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-brand-mint/20 bg-brand-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-mint">
                        {plan.canSubscribe ? 'Checkout ready' : 'Checkout unavailable'}
                    </span>
                    <span className="rounded-full border border-brand-light/70 bg-brand-light/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/6 dark:text-brand-light/65">
                        {billingTypeLabel(plan)}
                    </span>
                </div>

                <p className={clsx('mt-5 font-semibold leading-6 text-brand-navy dark:text-brand-light', isCompact ? 'text-sm' : 'min-h-[3rem] text-base')}>
                    {plan.description || 'Unlock the hotel contracting workspace.'}
                </p>

                {actionLabel ? (
                    actionTo ? (
                        <Link
                            to={actionTo}
                            aria-disabled={actionDisabled}
                            className={clsx(
                                'mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                                actionDisabled
                                    ? 'pointer-events-none border border-brand-light/70 bg-brand-light/70 text-brand-slate opacity-60 dark:border-brand-light/10 dark:bg-brand-light/8 dark:text-brand-light/55'
                                    : 'bg-brand-mint text-brand-light shadow-sm hover:bg-brand-mint/90',
                            )}
                        >
                            {plan.canSubscribe ? <CreditCard size={16} /> : <Sparkles size={16} />}
                            {actionLabel}
                            {!actionDisabled ? <ArrowRight size={16} /> : null}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            disabled={actionDisabled}
                            onClick={() => onAction?.(plan)}
                            className={clsx(
                                'mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                                isSelected
                                    ? 'border border-brand-mint/25 bg-brand-mint/10 text-brand-mint'
                                    : 'bg-brand-mint text-brand-light shadow-sm hover:bg-brand-mint/90',
                            )}
                        >
                            {isSelected ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                            {actionLabel}
                        </button>
                    )
                ) : null}

                <div className={clsx('space-y-3.5', actionLabel ? 'mt-6' : 'mt-5')}>
                    <PlanFeatureRow icon={Hotel}>{formatLimit(plan.maxHotels, 'hotel')}</PlanFeatureRow>
                    <PlanFeatureRow icon={Users}>{formatLimit(plan.maxUsers, 'team seat')}</PlanFeatureRow>
                    <PlanFeatureRow icon={plan.apiAccess ? KeyRound : LockKeyhole}>
                        {plan.apiAccess ? 'API access included' : 'API access not included'}
                    </PlanFeatureRow>
                    <PlanFeatureRow icon={ShieldCheck}>{plan.supportTier} support</PlanFeatureRow>
                    {!isCompact ? <PlanFeatureRow icon={CreditCard}>{billingTypeLabel(plan)}</PlanFeatureRow> : null}
                    {visibleFeatures.map((feature) => (
                        <PlanFeatureRow key={feature} icon={CheckCircle2}>{feature}</PlanFeatureRow>
                    ))}
                </div>
            </div>
        </>
    );

    const cardClassName = clsx(
        'group flex h-full flex-col rounded-2xl border bg-brand-light/88 p-5 text-left shadow-sm backdrop-blur-xl transition dark:bg-brand-light/[0.055] md:p-6',
        isCompact ? 'min-h-0' : 'min-h-[430px]',
        plan.apiAccess || plan.canSubscribe || isSelected
            ? 'border-brand-mint/30 shadow-brand-mint/5'
            : 'border-brand-light/70 dark:border-brand-light/12',
        isSelected
            ? 'ring-2 ring-brand-mint/35'
            : 'hover:-translate-y-0.5 hover:border-brand-mint/45 hover:shadow-lg hover:shadow-brand-navy/10',
    );

    if (isSelectable) {
        return (
            <button type="button" onClick={() => onAction?.(plan)} className={cardClassName}>
                {content}
            </button>
        );
    }

    return <article className={cardClassName}>{content}</article>;
}
