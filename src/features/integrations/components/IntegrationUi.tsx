import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, CircleSlash2, Copy, Gauge, Info, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import IntegrationSectionTabs from './IntegrationSectionTabs';

export type IntegrationTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'test' | 'production';

const toneAccent: Record<IntegrationTone, string> = {
    neutral: 'from-brand-navy/12 to-brand-slate/5 text-brand-navy dark:from-brand-light/10 dark:to-brand-light/5 dark:text-brand-light',
    success: 'from-brand-mint/18 to-brand-mint/5 text-brand-mint',
    warning: 'from-amber-400/20 to-amber-400/5 text-amber-600 dark:text-amber-300',
    danger: 'from-brand-coral/18 to-brand-coral/5 text-brand-coral',
    info: 'from-sky-400/18 to-sky-400/5 text-sky-600 dark:text-sky-300',
    test: 'from-brand-mint/18 to-brand-mint/5 text-brand-mint',
    production: 'from-brand-coral/18 to-brand-coral/5 text-brand-coral',
};

const badgeTone: Record<IntegrationTone, string> = {
    neutral: 'border-brand-slate/20 bg-brand-slate/10 text-brand-slate dark:text-brand-light/75',
    success: 'border-brand-mint/25 bg-brand-mint/10 text-brand-mint',
    warning: 'border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300',
    danger: 'border-brand-coral/30 bg-brand-coral/10 text-brand-coral',
    info: 'border-sky-400/30 bg-sky-400/10 text-sky-700 dark:text-sky-300',
    test: 'border-brand-mint/25 bg-brand-mint/10 text-brand-mint',
    production: 'border-brand-coral/30 bg-brand-coral/10 text-brand-coral',
};

export function IntegrationHero({
    eyebrow,
    title,
    description,
    badge,
    badgeTone: badgeToneName = 'success',
    actions,
}: {
    eyebrow: string;
    title: string;
    description: string;
    badge?: string;
    badgeTone?: IntegrationTone;
    actions?: ReactNode;
}) {
    return (
        <section className="relative w-full min-w-0 overflow-hidden rounded-[2rem] border border-brand-light/70 bg-brand-light/82 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/6 dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)] md:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.18),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.07),transparent_44%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(57,217,138,0.15),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]" />
            <div className="relative min-w-0">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_max-content] xl:items-start">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-mint">
                            {eyebrow}
                        </p>
                        <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                            {title}
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {description}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap xl:justify-end [&>button]:shrink-0">
                        {badge ? <IntegrationStatusBadge tone={badgeToneName} label={badge} /> : null}
                        {actions}
                    </div>
                </div>

                <div className="mt-6 min-w-0">
                    <IntegrationSectionTabs />
                </div>
            </div>
        </section>
    );
}

export function IntegrationSectionCard({
    eyebrow,
    title,
    description,
    actions,
    children,
    tone = 'neutral',
    className,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    tone?: IntegrationTone;
    className?: string;
}) {
    return (
        <section className={clsx(
            'relative w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-brand-light/70 bg-brand-light/78 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/6 dark:shadow-[0_18px_48px_rgba(0,0,0,0.24)] md:p-6',
            className,
        )}>
            <div className={clsx('pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r', toneAccent[tone])} />
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">
                        {eyebrow}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {description}
                        </p>
                    ) : null}
                </div>
                {actions}
            </div>
            <div className="mt-6">{children}</div>
        </section>
    );
}

export function IntegrationMetricCard({
    label,
    value,
    tone = 'neutral',
    icon,
    meta,
}: {
    label: string;
    value: string | number;
    tone?: IntegrationTone;
    icon?: ReactNode;
    meta?: string;
}) {
    return (
        <div className="group relative min-w-0 overflow-hidden rounded-[1.5rem] border border-brand-light/70 bg-brand-light/80 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.1)] dark:border-brand-light/10 dark:bg-brand-light/6 dark:shadow-[0_14px_36px_rgba(0,0,0,0.22)]">
            <div className={clsx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', toneAccent[tone])} />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/65">
                        {label}
                    </p>
                    <p className="mt-3 break-words text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        {value}
                    </p>
                    {meta ? <p className="mt-2 text-xs text-brand-slate dark:text-brand-light/65">{meta}</p> : null}
                </div>
                <div className={clsx('rounded-2xl bg-gradient-to-br p-2.5', toneAccent[tone])}>
                    {icon ?? <Gauge size={18} />}
                </div>
            </div>
        </div>
    );
}

export function IntegrationStatusBadge({ label, tone = 'neutral' }: { label: ReactNode; tone?: IntegrationTone }) {
    return (
        <span className={clsx('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', badgeTone[tone])}>
            {label}
        </span>
    );
}

export function IntegrationLogResultBadge({
    success,
    statusCode,
    errorCode,
}: {
    success: boolean;
    statusCode?: number | null;
    errorCode?: string | null;
}) {
    const { t } = useTranslation('common');
    const isRateLimited = statusCode === 429 || errorCode === 'RATE_LIMIT_EXCEEDED';
    const tone: IntegrationTone = success ? 'success' : isRateLimited ? 'warning' : 'danger';
    const Icon = success ? CheckCircle2 : isRateLimited ? AlertCircle : XCircle;
    const label = success
        ? t('pages.integrations.logs.table.success')
        : isRateLimited
            ? t('pages.integrations.logs.table.rateLimited')
            : t('pages.integrations.logs.table.failure');

    return (
        <IntegrationStatusBadge
            tone={tone}
            label={(
                <>
                    <Icon size={13} />
                    {label}
                </>
            )}
        />
    );
}

export function IntegrationEmptyState({
    title,
    description,
    icon,
}: {
    title: string;
    description?: string;
    icon?: ReactNode;
}) {
    return (
        <div className="rounded-[1.5rem] border border-dashed border-brand-slate/25 bg-brand-light/45 px-6 py-10 text-center dark:border-brand-light/12 dark:bg-brand-light/5">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                {icon ?? <CircleSlash2 size={18} />}
            </div>
            <p className="mt-4 text-sm font-semibold text-brand-navy dark:text-brand-light">{title}</p>
            {description ? <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-brand-slate dark:text-brand-light/70">{description}</p> : null}
        </div>
    );
}

export function IntegrationCodeBlock({
    value,
    className,
    copyValue,
}: {
    value: string;
    className?: string;
    copyValue?: string;
}) {
    const { t } = useTranslation('common');

    const handleCopy = async () => {
        if (!copyValue) return;
        await navigator.clipboard.writeText(copyValue);
        toast.success(t('pages.integrations.docs.copied'));
    };

    return (
        <div className="relative min-w-0">
            {copyValue ? (
                <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-light/10 bg-brand-light/10 text-brand-light transition hover:bg-brand-light/20"
                    aria-label={t('actions.copy')}
                >
                    <Copy size={15} />
                </button>
            ) : null}
            <pre className={clsx('max-h-96 min-w-0 overflow-auto rounded-[1.35rem] border border-brand-navy/10 bg-brand-navy/95 p-4 pr-14 text-xs leading-5 text-brand-light shadow-inner dark:border-brand-light/10', className)}>
                <code>{value}</code>
            </pre>
        </div>
    );
}

export function IntegrationDetailTile({
    label,
    value,
    mono,
    tone = 'neutral',
}: {
    label: string;
    value: ReactNode;
    mono?: boolean;
    tone?: IntegrationTone;
}) {
    return (
        <div className="rounded-[1.25rem] border border-brand-light/70 bg-brand-light/55 p-4 dark:border-brand-light/10 dark:bg-brand-light/5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/65">{label}</p>
            <div className={clsx('mt-2 break-words text-sm font-medium text-brand-navy dark:text-brand-light', mono && 'font-mono text-xs')}>
                {typeof value === 'string' ? value : value}
            </div>
            <div className={clsx('mt-3 h-0.5 rounded-full bg-gradient-to-r', toneAccent[tone])} />
        </div>
    );
}

export function IntegrationSecurityNote({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-[1.35rem] border border-brand-mint/20 bg-brand-mint/8 p-4 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
            <div className="flex gap-3">
                <Info size={17} className="mt-0.5 shrink-0 text-brand-mint" />
                <div>{children}</div>
            </div>
        </div>
    );
}
