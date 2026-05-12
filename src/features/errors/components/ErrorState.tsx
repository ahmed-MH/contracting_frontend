import { ArrowLeft, Home, LockKeyhole, RefreshCcw, SearchX, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';

type ErrorVariant = '404' | '403' | '500';

interface ErrorStateProps {
    variant: ErrorVariant;
    title: string;
    description: string;
    primaryLabel: string;
    primaryTo: string;
    secondaryLabel?: string;
    onSecondaryAction?: () => void;
    fullscreen?: boolean;
}

const variantMeta = {
    '404': {
        icon: SearchX,
        eyebrow: 'Page missing',
    },
    '403': {
        icon: LockKeyhole,
        eyebrow: 'Access control',
    },
    '500': {
        icon: TriangleAlert,
        eyebrow: 'Unexpected error',
    },
} satisfies Record<ErrorVariant, { icon: typeof SearchX; eyebrow: string }>;

export function ErrorState({
    variant,
    title,
    description,
    primaryLabel,
    primaryTo,
    secondaryLabel,
    onSecondaryAction,
    fullscreen = false,
}: ErrorStateProps) {
    const navigate = useNavigate();
    const meta = variantMeta[variant];
    const Icon = meta.icon;

    return (
        <main className={`${fullscreen ? 'min-h-screen' : 'min-h-[calc(100vh-9rem)]'} flex items-center justify-center bg-brand-navy px-5 py-10 text-brand-light`}>
            <section className="w-full max-w-3xl overflow-hidden rounded-2xl border border-brand-light/10 bg-brand-light/[0.04] shadow-2xl">
                <div className="border-b border-brand-light/10 px-6 py-5 sm:px-8">
                    <Logo tone="light" className="h-8" />
                </div>

                <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[11rem_1fr] lg:items-center">
                    <div className="flex aspect-square items-center justify-center rounded-2xl border border-brand-mint/20 bg-brand-mint/10 text-brand-mint">
                        <Icon size={52} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-brand-mint/25 bg-brand-mint/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-mint">
                                {variant}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-light/45">
                                {meta.eyebrow}
                            </span>
                        </div>

                        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-brand-light sm:text-4xl">
                            {title}
                        </h1>
                        <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-brand-light/65">
                            {description}
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(primaryTo)}
                                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-lg shadow-brand-mint/10 transition hover:-translate-y-0.5 hover:bg-brand-mint/90"
                            >
                                <Home size={16} />
                                {primaryLabel}
                            </button>

                            {secondaryLabel && onSecondaryAction && (
                                <button
                                    type="button"
                                    onClick={onSecondaryAction}
                                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-brand-light/12 bg-brand-light/8 px-4 text-sm font-semibold text-brand-light transition hover:bg-brand-light/12"
                                >
                                    {variant === '500' ? <RefreshCcw size={16} /> : <ArrowLeft size={16} />}
                                    {secondaryLabel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
