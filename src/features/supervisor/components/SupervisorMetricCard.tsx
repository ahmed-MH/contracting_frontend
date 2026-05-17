import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SupervisorMetricCardProps {
    label: string;
    value: string;
    delta: string;
    description: string;
    icon: LucideIcon;
    tone?: 'mint' | 'navy' | 'amber';
}

const toneClasses = {
    mint: 'bg-brand-mint/10 text-brand-mint',
    navy: 'bg-brand-navy/8 text-brand-navy dark:bg-brand-light/10 dark:text-brand-light',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
} as const;

export function SupervisorMetricCard({
    label,
    value,
    delta,
    description,
    icon: Icon,
    tone = 'mint',
}: SupervisorMetricCardProps) {
    const { t } = useTranslation('common');
    void t;
    return (
        <div className="rounded-2xl border border-brand-slate/15 bg-white/80 p-5 shadow-sm shadow-brand-navy/5 backdrop-blur-xl dark:border-brand-light/10 dark:bg-brand-light/5 dark:shadow-none">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-brand-slate dark:text-brand-light/65">{label}</p>
                    <p className="mt-5 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        {value}
                    </p>
                    <p className="mt-2 text-sm font-medium text-brand-mint dark:text-brand-mint">{delta}</p>
                </div>
                <div className={clsx('rounded-2xl p-3', toneClasses[tone])}>
                    <Icon size={18} />
                </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                {description}
            </p>
        </div>
    );
}
