import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CreditCard, Hotel, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { Spinner } from '../../components/ui/Spinner';
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

const initialFormState: OnboardingFormState = {
    companyName: '',
    adminFullName: '',
    adminEmail: '',
    phone: '',
};

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
    return plan.billingType === 'ONE_TIME' ? ' one-time' : ' / month';
}

function formatLimit(value: number, noun: string): string {
    return value >= 9999 ? `Unlimited ${noun}` : `${value} ${noun}`;
}

function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
        const message = response?.data?.message;
        if (Array.isArray(message)) return message.join(', ');
        if (message) return message;
    }

    return error instanceof Error ? error.message : 'Unable to start checkout. Please try again.';
}

export default function OnboardingPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const plansQuery = usePublicPlans();
    const checkoutMutation = useCreatePublicOnboardingCheckoutSession();
    const [form, setForm] = useState<OnboardingFormState>(initialFormState);
    const [formError, setFormError] = useState<string | null>(null);

    const plans = plansQuery.data ?? [];
    const selectedPlanId = Number(searchParams.get('planId'));
    const selectedPlan = useMemo(
        () => plans.find((plan) => plan.id === selectedPlanId) ?? plans.find((plan) => plan.canSubscribe) ?? plans[0],
        [plans, selectedPlanId],
    );

    const submitDisabled = !selectedPlan?.canSubscribe || checkoutMutation.isPending || plansQuery.isLoading;

    const updateField = (field: keyof OnboardingFormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const selectPlan = (planId: number) => {
        setSearchParams({ planId: String(planId) });
        setFormError(null);
    };

    const validate = () => {
        if (!selectedPlan) return 'Choose a plan before continuing.';
        if (!selectedPlan.canSubscribe) return 'This plan is not ready for online checkout yet. Please contact sales.';
        if (!form.companyName.trim()) return 'Company or hotel name is required.';
        if (!form.adminFullName.trim()) return 'Admin full name is required.';
        if (!form.adminEmail.trim()) return 'Admin email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) return 'Enter a valid admin email.';
        return null;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const validationError = validate();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setFormError(null);
        try {
            const result = await checkoutMutation.mutateAsync({
                planId: selectedPlan!.id,
                companyName: form.companyName.trim(),
                adminFullName: form.adminFullName.trim(),
                adminEmail: form.adminEmail.trim(),
                phone: form.phone.trim() || undefined,
            });
            window.location.assign(result.checkoutUrl);
        } catch (error) {
            setFormError(getErrorMessage(error));
        }
    };

    return (
        <div className="min-h-screen bg-brand-light text-brand-navy dark:bg-brand-navy dark:text-brand-light">
            <header className="border-b border-brand-navy/10 bg-brand-light/80 px-4 py-4 backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-navy/80 md:px-6">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                    <Link to="/" className="inline-flex rounded-2xl border border-brand-light/70 bg-brand-light/80 px-3 py-2 shadow-sm dark:border-brand-light/10 dark:bg-brand-navy/80">
                        <Logo />
                    </Link>
                    <Link to="/login" className="text-sm font-semibold text-brand-slate transition hover:text-brand-navy dark:hover:text-brand-light">
                        Log in
                    </Link>
                </div>
            </header>

            <main className="px-4 py-10 md:px-6 md:py-14">
                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr,1.08fr] lg:items-start">
                    <section>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-mint">Public onboarding</p>
                        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-brand-navy dark:text-brand-light md:text-5xl">
                            Subscribe, then activate your tenant admin account.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-8 text-brand-slate">
                            Payment creates the tenant organization. Your first user is invited as an ADMIN and can set a password from the activation link.
                        </p>

                        <div className="mt-8 rounded-2xl border border-brand-mint/20 bg-brand-mint/10 p-5 text-sm leading-7 text-brand-navy dark:border-brand-mint/25 dark:bg-brand-mint/15 dark:text-brand-light">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-1 shrink-0 text-brand-mint" size={18} />
                                <p>No tenant or user is created until Stripe confirms the subscription payment.</p>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-3">
                            {plansQuery.isLoading ? (
                                <div className="rounded-2xl border border-brand-light/70 bg-brand-light/70 p-5 text-sm text-brand-slate shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                                    Loading plans...
                                </div>
                            ) : plansQuery.isError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                                    Plans are temporarily unavailable.
                                </div>
                            ) : plans.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-brand-light/70 bg-brand-light/60 p-5 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5">
                                    No plans are currently published.
                                </div>
                            ) : (
                                plans.map((plan) => {
                                    const active = selectedPlan?.id === plan.id;
                                    return (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => selectPlan(plan.id)}
                                            className={`w-full rounded-2xl border p-5 text-left shadow-sm transition ${
                                                active
                                                    ? 'border-brand-mint/45 bg-brand-navy text-brand-light'
                                                    : 'border-brand-light/70 bg-brand-light/78 text-brand-navy hover:border-brand-mint/30 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${active ? 'text-brand-mint' : 'text-brand-slate'}`}>{plan.name}</p>
                                                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                                                        {formatPlanPrice(plan)}
                                                        {plan.monthlyPrice > 0 ? <span className="text-sm font-medium text-brand-slate">{formatBillingCadence(plan)}</span> : null}
                                                    </p>
                                                </div>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.canSubscribe ? 'bg-brand-mint/15 text-brand-mint' : 'bg-brand-light/10 text-brand-slate'}`}>
                                                    {plan.canSubscribe ? 'Checkout ready' : 'Contact sales'}
                                                </span>
                                            </div>
                                            <p className={`mt-3 text-sm leading-7 ${active ? 'text-brand-slate' : 'text-brand-slate dark:text-brand-light/70'}`}>{plan.description}</p>
                                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                                                <span className="rounded-full bg-brand-light/10 px-3 py-1">{formatLimit(plan.maxHotels, 'hotels')}</span>
                                                <span className="rounded-full bg-brand-light/10 px-3 py-1">{formatLimit(plan.maxUsers, 'users')}</span>
                                                <span className="rounded-full bg-brand-light/10 px-3 py-1">{plan.supportTier} support</span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-brand-light/70 bg-brand-light/82 p-5 shadow-md dark:border-brand-light/10 dark:bg-brand-navy/80 md:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">Checkout details</p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">Create your tenant workspace</h2>
                            </div>
                            <div className="rounded-2xl bg-brand-mint/10 p-3 text-brand-mint">
                                <CreditCard size={20} />
                            </div>
                        </div>

                        {selectedPlan ? (
                            <div className="mt-6 rounded-2xl border border-brand-navy/10 bg-brand-navy p-5 text-brand-light dark:border-brand-light/10">
                                <div className="flex items-start gap-3">
                                    <Hotel className="mt-1 shrink-0 text-brand-mint" size={18} />
                                    <div>
                                        <p className="text-sm font-semibold">{selectedPlan.name}</p>
                                        <p className="mt-1 text-sm text-brand-slate">{formatPlanPrice(selectedPlan)}{formatBillingCadence(selectedPlan)}</p>
                                    </div>
                                </div>
                                {!selectedPlan.canSubscribe ? (
                                    <p className="mt-4 rounded-2xl border border-brand-light/10 bg-brand-light/8 px-4 py-3 text-sm text-brand-slate">
                                        Online checkout is not configured for this plan yet. Choose another plan or contact sales.
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                            <label className="block">
                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Company or hotel name</span>
                                <input
                                    value={form.companyName}
                                    onChange={(event) => updateField('companyName', event.target.value)}
                                    className="mt-2 min-h-12 w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                    placeholder="Marriott Tunis"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Admin full name</span>
                                <input
                                    value={form.adminFullName}
                                    onChange={(event) => updateField('adminFullName', event.target.value)}
                                    className="mt-2 min-h-12 w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                    placeholder="Nadia Ben Ali"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Admin email</span>
                                <input
                                    value={form.adminEmail}
                                    onChange={(event) => updateField('adminEmail', event.target.value)}
                                    className="mt-2 min-h-12 w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                    placeholder="admin@example.com"
                                    type="email"
                                />
                            </label>
                            <label className="block">
                                <span className="text-sm font-semibold text-brand-navy dark:text-brand-light">Phone optional</span>
                                <input
                                    value={form.phone}
                                    onChange={(event) => updateField('phone', event.target.value)}
                                    className="mt-2 min-h-12 w-full rounded-2xl border border-brand-light/70 bg-brand-light/80 px-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                                    placeholder="+216 00 000 000"
                                />
                            </label>

                            {formError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={submitDisabled}
                                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-mint px-6 text-base font-semibold text-brand-light shadow-md transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {checkoutMutation.isPending ? <Spinner /> : <CreditCard size={18} />}
                                Continue to secure checkout
                            </button>
                        </form>

                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-light/70 bg-brand-light/60 px-4 py-4 text-sm leading-7 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5">
                            <Mail className="mt-1 shrink-0 text-brand-mint" size={17} />
                            <p>After payment, the activation invitation is sent to the admin email. In development, the invite link is printed by the backend mail service.</p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
