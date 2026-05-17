import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';

export default function OnboardingCancelPage() {
    return (
        <div className="min-h-screen bg-brand-light px-4 py-10 text-brand-navy dark:bg-brand-navy dark:text-brand-light md:px-6">
            <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
                <Link to="/" className="mb-8 inline-flex w-fit rounded-2xl border border-brand-light/70 bg-brand-light/80 px-3 py-2 shadow-sm dark:border-brand-light/10 dark:bg-brand-navy/80">
                    <Logo />
                </Link>
                <div className="rounded-2xl border border-brand-light/70 bg-brand-light/82 p-7 shadow-md dark:border-brand-light/10 dark:bg-brand-navy/80 md:p-9">
                    <div className="inline-flex rounded-2xl bg-brand-navy/8 p-3 text-brand-mint dark:bg-brand-light/10">
                        <CreditCard size={24} />
                    </div>
                    <h1 className="mt-6 text-4xl font-semibold tracking-tight">Checkout canceled.</h1>
                    <p className="mt-4 text-base leading-8 text-brand-slate">
                        Payment was canceled or not completed, so no tenant workspace was provisioned and no admin invitation was sent. You can return to plan selection or restart onboarding whenever you are ready.
                    </p>
                    <Link
                        to="/onboarding"
                        className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-navy px-6 text-base font-semibold text-brand-light shadow-md transition hover:bg-brand-navy/90"
                    >
                        Back to onboarding
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </main>
        </div>
    );
}
