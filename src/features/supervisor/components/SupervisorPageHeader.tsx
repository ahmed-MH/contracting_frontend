import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface SupervisorPageHeaderProps {
    eyebrow: string;
    title: string;
    description: string;
    badge?: string;
    badgeTone?: 'mint' | 'slate' | 'amber';
    actions?: ReactNode;
}

const badgeToneClasses = {
    mint: 'border-brand-mint/20 bg-brand-mint/8 text-brand-mint',
    slate: 'border-brand-slate/20 bg-white/80 text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75',
    amber: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200',
} as const;

export function SupervisorPageHeader({
    eyebrow,
    title,
    description,
    badge,
    badgeTone = 'mint',
    actions,
}: SupervisorPageHeaderProps) {
    const { t } = useTranslation('common');
    void t;
    return (
        <section className="premium-surface p-6 md:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0 max-w-4xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate dark:text-brand-light/60">
                        {eyebrow}
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        {title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                        {description}
                    </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    {badge && (
                        <span className={clsx('premium-pill', badgeToneClasses[badgeTone])}>
                            {badge}
                        </span>
                    )}
                    {actions ? (
                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                            {actions}
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
