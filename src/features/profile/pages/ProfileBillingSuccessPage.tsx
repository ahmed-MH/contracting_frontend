import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSyncTenantCheckoutSession } from '../hooks/useProfile';

export default function ProfileBillingSuccessPage() {
    const syncCheckout = useSyncTenantCheckoutSession();

    const checkPaymentStatus = () => {
        syncCheckout.mutate(undefined, {
            onSuccess: (result) => {
                if (result.billingStatus === 'ACTIVE' || result.resolved) {
                    toast.success(result.message || 'Billing activated.');
                    return;
                }

                toast.error(result.message || 'Still waiting for Stripe confirmation.');
            },
        });
    };

    return (
        <div className="flex min-h-[70vh] items-center justify-center p-4 md:p-6">
            <section className="w-full max-w-2xl rounded-2xl border border-brand-light/70 bg-brand-light/82 p-6 text-center shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/6 md:p-8">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                    <CheckCircle2 size={24} />
                </span>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-mint">Billing</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">Payment completed.</h1>
                <p className="mt-3 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                    We are confirming it through Stripe. Your billing status will update after the webhook is processed.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        onClick={checkPaymentStatus}
                        disabled={syncCheckout.isPending}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-mint px-5 text-sm font-semibold text-brand-light shadow-sm transition hover:bg-brand-mint/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {syncCheckout.isPending ? 'Checking...' : 'Check payment status'}
                    </button>
                    <Link
                        to="/profile"
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-5 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    >
                        Back to profile
                    </Link>
                </div>
            </section>
        </div>
    );
}
