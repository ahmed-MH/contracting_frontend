import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function ProfileBillingCancelPage() {
    return (
        <div className="flex min-h-[70vh] items-center justify-center p-4 md:p-6">
            <section className="w-full max-w-2xl rounded-2xl border border-brand-light/70 bg-brand-light/82 p-6 text-center shadow-sm backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/6 md:p-8">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-coral/10 text-brand-coral">
                    <XCircle size={24} />
                </span>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-coral">Billing</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">Payment was canceled.</h1>
                <p className="mt-3 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                    Your billing status remains payment required.
                </p>
                <Link
                    to="/profile"
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-brand-light/70 bg-brand-light/70 px-5 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                >
                    Back to profile
                </Link>
            </section>
        </div>
    );
}
