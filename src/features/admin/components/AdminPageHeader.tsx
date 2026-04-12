import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface AdminPageHeaderProps {
    eyebrow: string;
    title: string;
    description: string;
    badge?: string;
    badgeTone?: 'mint' | 'navy' | 'amber';
    actions?: ReactNode;
    children?: ReactNode;
}

const badgeToneClasses = {
    mint: 'border-brand-mint/20 bg-brand-mint/8 text-brand-mint',
    navy: 'border-brand-navy/10 bg-brand-navy text-white dark:border-white/10 dark:bg-white/8 dark:text-white',
    amber: 'border-brand-slate/30 bg-brand-slate/10 text-brand-slate dark:border-brand-slate/30 dark:bg-brand-navy/80 dark:text-brand-light/75',
} as const;

export default function AdminPageHeader({
    eyebrow,
    title,
    description,
    badge,
    badgeTone = 'mint',
    actions,
    children,
}: AdminPageHeaderProps) {
    return (
        <section className="premium-surface relative overflow-hidden p-6 md:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-brand-mint/10 dark:bg-brand-navy/80" />

            <div className="relative">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
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

                {children && <div className="mt-6">{children}</div>}
            </div>
        </section>
    );
}
