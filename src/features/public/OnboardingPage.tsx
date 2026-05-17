import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    CheckCircle2,
    ChevronLeft,
    CreditCard,
    Hotel,
    KeyRound,
    LockKeyhole,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { Spinner } from '../../components/ui/Spinner';
import { PlanCard } from './PlanCard';
import {
    useCreatePublicOnboardingCheckoutSession,
    usePublicPlans,
    type PublicPlan,
} from './hooks/usePublicPlans';

interface OnboardingFormState {
    companyName: string;
    adminFullName: string;
    adminEmail: string;
    phone: string;
}

type OnboardingFieldErrors = Partial<Record<keyof OnboardingFormState, string>>;

const initialFormState: OnboardingFormState = {
    companyName: '',
    adminFullName: '',
    adminEmail: '',
    phone: '',
};

const ONBOARDING_FORM_ID = 'public-onboarding-form';
const ONLINE_CHECKOUT_UNAVAILABLE_MESSAGE =
    'Online checkout is not enabled for this plan yet. Please contact the platform team or choose another plan.';

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

function billingTypeLabel(plan: PublicPlan): string {
    return plan.billingType === 'ONE_TIME' ? 'One-time payment' : 'Monthly subscription';
}

function billingCadence(plan: PublicPlan): string {
    if (plan.monthlyPrice <= 0) return '';
    return plan.billingType === 'ONE_TIME' ? 'one-time' : '/ month';
}

function formatLimit(value: number, singular: string, plural = `${singular}s`): string {
    return value >= 9999 ? `Unlimited ${plural}` : `${value} ${value === 1 ? singular : plural}`;
}

function inputClass(hasError: boolean): string {
    const baseClass =
        'mt-2 h-14 w-full rounded-2xl bg-white px-5 text-sm font-semibold text-brand-navy shadow-sm outline-none transition placeholder:text-brand-slate/55 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-light/[0.12] dark:text-brand-light dark:placeholder:text-brand-light/35';
    const stateClass = hasError
        ? 'border border-brand-coral/60 focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/20 dark:border-brand-coral/55'
        : 'border border-brand-slate/20 hover:border-brand-mint/35 focus:border-brand-mint focus:ring-2 focus:ring-brand-mint/20 dark:border-brand-light/12 dark:hover:border-brand-mint/45';

    return `${baseClass} ${stateClass}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) return null;

    return (
        <p id={id} role="alert" className="mt-2 text-xs font-semibold text-brand-coral">
            {message}
        </p>
    );
}

function FeatureLine({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
    return (
        <div className="flex items-start gap-3 text-sm leading-6 text-brand-slate dark:text-brand-light/78">
            <Icon className="mt-0.5 shrink-0 text-brand-mint" size={16} strokeWidth={1.9} />
            <span>{children}</span>
        </div>
    );
}

function PlanSummaryCard({
    plan,
    checkoutUnavailable,
    isSubmitting,
}: {
    plan: PublicPlan;
    checkoutUnavailable: boolean;
    isSubmitting: boolean;
}) {
    const visibleFeatures = plan.features.slice(0, 5);
    const price = formatPlanPrice(plan);
    const cadence = billingCadence(plan);

    return (
        <aside className="rounded-[1.75rem] border border-brand-light/70 bg-brand-light/88 p-6 text-brand-navy shadow-2xl shadow-brand-navy/10 backdrop-blur-xl dark:border-brand-light/12 dark:bg-brand-light/[0.085] dark:text-brand-light dark:shadow-black/30">
            <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-mint">
                    Selected plan
                </span>
                <span className="rounded-full border border-brand-light/70 bg-brand-light/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate dark:border-brand-light/12 dark:bg-brand-light/8 dark:text-brand-light/65">
                    {plan.canSubscribe ? 'Checkout ready' : 'Checkout unavailable'}
                </span>
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{plan.name}</h2>
            <p className="mt-3 text-sm leading-7 text-brand-slate dark:text-brand-light/70">{plan.description}</p>

            <div className="mt-7 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">{price}</span>
                {cadence ? <span className="pb-2 text-sm font-semibold text-brand-slate dark:text-brand-light/60">{cadence}</span> : null}
            </div>

            <div className="mt-7 space-y-4">
                <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">Plan includes</p>
                <FeatureLine icon={Hotel}>{formatLimit(plan.maxHotels, 'hotel')}</FeatureLine>
                <FeatureLine icon={Users}>{formatLimit(plan.maxUsers, 'team seat')}</FeatureLine>
                <FeatureLine icon={plan.apiAccess ? KeyRound : LockKeyhole}>
                    {plan.apiAccess ? 'API access included' : 'API access not included'}
                </FeatureLine>
                <FeatureLine icon={ShieldCheck}>{plan.supportTier} support</FeatureLine>
                <FeatureLine icon={CreditCard}>{billingTypeLabel(plan)}</FeatureLine>
                {visibleFeatures.map((feature) => (
                    <FeatureLine key={feature} icon={CheckCircle2}>{feature}</FeatureLine>
                ))}
            </div>

            <div className="mt-8 border-t border-brand-light/70 pt-6 dark:border-brand-light/12">
                <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-brand-slate dark:text-brand-light/65">{billingTypeLabel(plan)}</span>
                    <span className="font-semibold text-brand-navy dark:text-brand-light">{price}{cadence ? ` ${cadence}` : ''}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-base font-semibold">
                    <span className="text-brand-navy dark:text-brand-light">Due today</span>
                    <span className="text-brand-navy dark:text-brand-light">{price}</span>
                </div>
            </div>

            {checkoutUnavailable ? (
                <div className="mt-6 rounded-2xl border border-brand-light/70 bg-brand-light/60 p-4 dark:border-brand-light/12 dark:bg-brand-light/8">
                    <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">Online checkout unavailable</p>
                    <p className="mt-2 text-sm leading-7 text-brand-slate dark:text-brand-light/65">{ONLINE_CHECKOUT_UNAVAILABLE_MESSAGE}</p>
                    <div className="mt-4 grid gap-3">
                        <Link
                            to="/#plans"
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-mint px-5 text-sm font-semibold text-brand-light transition hover:bg-brand-mint/90"
                        >
                            Back to plans
                        </Link>
                        <Link
                            to="/onboarding"
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-5 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/12 dark:bg-brand-light/8 dark:text-brand-light dark:hover:bg-brand-light/12"
                        >
                            Choose another plan
                        </Link>
                    </div>
                </div>
            ) : (
                <button
                    type="submit"
                    form={ONBOARDING_FORM_ID}
                    disabled={isSubmitting}
                    className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-mint px-6 text-base font-semibold text-brand-light shadow-lg shadow-brand-mint/15 transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? <Spinner /> : <CreditCard size={18} />}
                    Continue to secure checkout
                </button>
            )}

            <p className="mt-6 text-xs leading-6 text-brand-slate dark:text-brand-light/55">
                No tenant or user is created until the signed Stripe webhook confirms the payment.
            </p>
        </aside>
    );
}

export default function OnboardingPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const plansQuery = usePublicPlans();
    const checkoutMutation = useCreatePublicOnboardingCheckoutSession();
    const [form, setForm] = useState<OnboardingFormState>(initialFormState);
    const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({});

    const plans = plansQuery.data ?? [];
    const planIdParam = searchParams.get('planId');
    const requestedPlanId = planIdParam === null ? null : Number(planIdParam);
    const hasRequestedPlan = planIdParam !== null;
    const selectedPlan = useMemo(() => {
        if (!hasRequestedPlan || !Number.isFinite(requestedPlanId)) return undefined;
        return plans.find((plan) => plan.id === requestedPlanId);
    }, [hasRequestedPlan, plans, requestedPlanId]);

    const invalidPlanId = hasRequestedPlan
        && !plansQuery.isLoading
        && !plansQuery.isError
        && (!Number.isFinite(requestedPlanId) || !selectedPlan);
    const checkoutUnavailable = Boolean(selectedPlan && !selectedPlan.canSubscribe);
    const formDisabled = !selectedPlan?.canSubscribe || checkoutMutation.isPending;

    const updateField = (field: keyof OnboardingFormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    const selectPlan = (plan: PublicPlan) => {
        setSearchParams({ planId: String(plan.id) });
        setFieldErrors({});
    };

    const validate = (): { errors: OnboardingFieldErrors; generalError: string | null } => {
        const errors: OnboardingFieldErrors = {};

        if (!selectedPlan) return { errors, generalError: 'Choose a plan before continuing.' };
        if (!selectedPlan.canSubscribe) return { errors, generalError: ONLINE_CHECKOUT_UNAVAILABLE_MESSAGE };
        if (!form.companyName.trim()) errors.companyName = 'Company or hotel name is required.';
        if (!form.adminFullName.trim()) errors.adminFullName = 'Admin full name is required.';
        if (!form.adminEmail.trim()) {
            errors.adminEmail = 'Admin email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) {
            errors.adminEmail = 'Enter a valid admin email.';
        }

        return { errors, generalError: null };
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (checkoutMutation.isPending) return;

        const validation = validate();
        if (validation.generalError) {
            toast.error(validation.generalError);
            return;
        }

        if (Object.keys(validation.errors).length > 0) {
            setFieldErrors(validation.errors);
            toast.error('Please check the highlighted fields.');
            return;
        }

        setFieldErrors({});
        try {
            const result = await checkoutMutation.mutateAsync({
                planId: selectedPlan!.id,
                companyName: form.companyName.trim(),
                adminFullName: form.adminFullName.trim(),
                adminEmail: form.adminEmail.trim(),
                phone: form.phone.trim() || undefined,
            });
            window.location.assign(result.checkoutUrl);
        } catch {
            // Request errors are surfaced by the shared API client toast handler.
        }
    };

    return (
        <div className="min-h-screen bg-brand-light text-brand-navy dark:bg-brand-navy dark:text-brand-light">
            <header className="px-5 py-6 md:px-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <Link to="/" className="inline-flex rounded-2xl border border-brand-light/70 bg-brand-light/80 px-3 py-2 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/6">
                        <Logo />
                    </Link>
                    <Link to="/login" className="text-sm font-semibold text-brand-slate transition hover:text-brand-navy dark:text-brand-light/65 dark:hover:text-brand-light">
                        Log in
                    </Link>
                </div>
            </header>

            <main className="px-5 pb-16 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <Link to="/#plans" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-slate transition hover:text-brand-mint dark:text-brand-light/65">
                        <ChevronLeft size={18} />
                        Back to plans
                    </Link>

                    {plansQuery.isLoading ? (
                        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,31rem)_27rem] lg:items-start lg:justify-center">
                            <div className="space-y-5">
                                <div className="h-10 w-72 animate-pulse rounded-xl bg-brand-slate/10 dark:bg-brand-light/10" />
                                <div className="h-96 animate-pulse rounded-[1.75rem] bg-brand-slate/10 dark:bg-brand-light/8" />
                            </div>
                            <div className="h-[34rem] animate-pulse rounded-[1.75rem] bg-brand-slate/10 dark:bg-brand-light/8" />
                        </div>
                    ) : plansQuery.isError ? (
                        <section className="mx-auto mt-16 max-w-xl rounded-[1.75rem] border border-brand-light/70 bg-brand-light/88 p-8 text-center shadow-2xl shadow-brand-navy/10 dark:border-brand-light/12 dark:bg-brand-light/[0.085] dark:shadow-black/30">
                            <p className="text-xl font-semibold">Plans are temporarily unavailable.</p>
                            <p className="mt-3 text-sm leading-7 text-brand-slate dark:text-brand-light/65">Please try loading the active public plans again.</p>
                            <button
                                type="button"
                                onClick={() => plansQuery.refetch()}
                                className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand-mint px-6 text-sm font-semibold text-brand-light transition hover:bg-brand-mint/90"
                            >
                                Retry
                            </button>
                        </section>
                    ) : !selectedPlan ? (
                        <section className="mx-auto mt-12 max-w-5xl">
                            <div className="max-w-2xl">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-mint">Choose a plan</p>
                                <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                                    {invalidPlanId ? 'This plan is no longer available.' : 'Start your hotel contracting workspace'}
                                </h1>
                                <p className="mt-5 text-base leading-8 text-brand-slate dark:text-brand-light/65">
                                    {invalidPlanId
                                        ? 'Choose another active plan to continue onboarding.'
                                        : 'Select a public plan first, then create your tenant workspace.'}
                                </p>
                            </div>

                            {plans.length === 0 ? (
                                <div className="mt-8 rounded-[1.75rem] border border-dashed border-brand-light/70 bg-brand-light/60 p-8 text-center text-sm font-semibold text-brand-slate dark:border-brand-light/15 dark:bg-brand-light/[0.065] dark:text-brand-light/65">
                                    No active public plans are available right now.
                                </div>
                            ) : (
                                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {plans.map((plan) => (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            variant="selectable"
                                            onAction={selectPlan}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : (
                        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,31rem)_27rem] lg:items-start lg:justify-center xl:gap-16">
                            <section>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-mint">Public onboarding</p>
                                <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                                    Start your hotel contracting workspace
                                </h1>
                                <p className="mt-5 text-base leading-8 text-brand-slate dark:text-brand-light/65">
                                    Create your tenant workspace and continue to secure checkout. Your account is provisioned only after Stripe confirms payment.
                                </p>

                                <form id={ONBOARDING_FORM_ID} className="mt-10 space-y-6" onSubmit={handleSubmit}>
                                    <div>
                                        <div className="mb-4 flex items-center gap-3">
                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-mint text-sm font-semibold text-brand-light">1</span>
                                            <h2 className="text-lg font-semibold text-brand-navy dark:text-brand-light">Workspace details</h2>
                                        </div>
                                        <div className="rounded-[1.5rem] border border-brand-light/70 bg-brand-light/88 p-4 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/[0.055] sm:p-5">
                                            <div className="space-y-4">
                                            <label className="block">
                                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Company or hotel name</span>
                                                <input
                                                    value={form.companyName}
                                                    onChange={(event) => updateField('companyName', event.target.value)}
                                                    disabled={formDisabled}
                                                    aria-invalid={Boolean(fieldErrors.companyName)}
                                                    aria-describedby={fieldErrors.companyName ? 'companyName-error' : undefined}
                                                    className={inputClass(Boolean(fieldErrors.companyName))}
                                                    placeholder="Marriott Tunis"
                                                />
                                                <FieldError id="companyName-error" message={fieldErrors.companyName} />
                                            </label>
                                            <label className="block">
                                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Admin full name</span>
                                                <input
                                                    value={form.adminFullName}
                                                    onChange={(event) => updateField('adminFullName', event.target.value)}
                                                    disabled={formDisabled}
                                                    aria-invalid={Boolean(fieldErrors.adminFullName)}
                                                    aria-describedby={fieldErrors.adminFullName ? 'adminFullName-error' : undefined}
                                                    className={inputClass(Boolean(fieldErrors.adminFullName))}
                                                    placeholder="Nadia Ben Ali"
                                                />
                                                <FieldError id="adminFullName-error" message={fieldErrors.adminFullName} />
                                            </label>
                                            <label className="block">
                                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Admin email</span>
                                                <input
                                                    value={form.adminEmail}
                                                    onChange={(event) => updateField('adminEmail', event.target.value)}
                                                    disabled={formDisabled}
                                                    aria-invalid={Boolean(fieldErrors.adminEmail)}
                                                    aria-describedby={fieldErrors.adminEmail ? 'adminEmail-error' : undefined}
                                                    className={inputClass(Boolean(fieldErrors.adminEmail))}
                                                    placeholder="admin@example.com"
                                                    type="email"
                                                />
                                                <FieldError id="adminEmail-error" message={fieldErrors.adminEmail} />
                                            </label>
                                            <label className="block">
                                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Phone optional</span>
                                                <input
                                                    value={form.phone}
                                                    onChange={(event) => updateField('phone', event.target.value)}
                                                    disabled={formDisabled}
                                                    className={inputClass(false)}
                                                    placeholder="+216 00 000 000"
                                                />
                                            </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-brand-mint/20 bg-brand-mint/10 p-4">
                                        <div className="flex items-start gap-3 text-sm leading-7 text-brand-navy dark:text-brand-light/75">
                                            <ShieldCheck className="mt-1 shrink-0 text-brand-mint" size={18} />
                                            <p>No tenant or user is created until the signed Stripe webhook confirms the payment.</p>
                                        </div>
                                    </div>

                                    {checkoutUnavailable ? (
                                        <div className="rounded-2xl border border-brand-light/70 bg-brand-light/60 p-4 text-sm leading-7 text-brand-slate dark:border-brand-light/12 dark:bg-brand-light/8 dark:text-brand-light/65">
                                            <p className="font-semibold text-brand-navy dark:text-brand-light">Online checkout unavailable</p>
                                            <p className="mt-1">{ONLINE_CHECKOUT_UNAVAILABLE_MESSAGE}</p>
                                        </div>
                                    ) : null}
                                </form>
                            </section>

                            <PlanSummaryCard
                                plan={selectedPlan}
                                checkoutUnavailable={checkoutUnavailable}
                                isSubmitting={checkoutMutation.isPending}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
