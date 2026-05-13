import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';

export default function OnboardingSuccessPage() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    return (
        <div className="min-h-screen bg-brand-light px-4 py-10 text-brand-navy dark:bg-brand-navy dark:text-brand-light md:px-6">
            <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
                <Link to="/" className="mb-8 inline-flex w-fit rounded-2xl border border-brand-light/70 bg-brand-light/80 px-3 py-2 shadow-sm dark:border-brand-light/10 dark:bg-brand-navy/80">
                    <Logo />
                </Link>
                <div className="rounded-2xl border border-brand-light/70 bg-brand-light/82 p-7 shadow-md dark:border-brand-light/10 dark:bg-brand-navy/80 md:p-9">
                    <div className="inline-flex rounded-2xl bg-brand-mint/10 p-3 text-brand-mint">
                        <CheckCircle2 size={24} />
                    </div>
                    <h1 className="mt-6 text-4xl font-semibold tracking-tight">Payment completed.</h1>
                    <p className="mt-4 text-base leading-8 text-brand-slate">
                        Your tenant workspace is being prepared. The first ADMIN user will receive an invitation link to activate the account and set a password.
                    </p>
                    {sessionId ? (
                        <p className="mt-5 rounded-2xl border border-brand-light/70 bg-brand-light/60 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5">
                            Checkout session: {sessionId}
                        </p>
                    ) : null}
                    <Link
                        to="/login"
                        className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-6 text-base font-semibold text-brand-light shadow-md transition hover:bg-brand-mint/90"
                    >
                        Go to login
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </main>
        </div>
    );
}
