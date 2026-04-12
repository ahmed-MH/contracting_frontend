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
    slate: 'border-brand-slate/20 bg-brand-light text-brand-slate dark:border-white/10 dark:bg-white/5 dark:text-brand-light/75',
    amber: 'border-brand-slate/30 bg-brand-slate/10 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75',
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
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                        {eyebrow}
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-white">
                        {title}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                        {description}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {badge && (
                        <span className={clsx('premium-pill', badgeToneClasses[badgeTone])}>
                            {badge}
                        </span>
                    )}
                    {actions}
                </div>
            </div>
        </section>
    );
}
