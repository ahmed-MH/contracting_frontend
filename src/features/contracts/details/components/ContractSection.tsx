import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface ContractSectionShellProps {
    icon: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    count?: number;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}

interface ContractSectionEmptyProps {
    icon: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}

interface ContractSectionLoadingProps {
    label?: ReactNode;
}

interface ContractSectionAlertProps {
    children: ReactNode;
}

export function ContractSectionShell({
    icon: Icon,
    title,
    description,
    count,
    action,
    children,
    className,
    bodyClassName,
}: ContractSectionShellProps) {
    return (
        <section
            className={clsx(
                'contract-section-surface overflow-hidden',
                className,
            )}
        >
            <div className="flex flex-col gap-4 border-b border-brand-slate/10 px-5 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-brand-light/10">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint">
                        <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                {title}
                            </h2>
                            {typeof count === 'number' && (
                                <span className="rounded-full border border-brand-slate/15 px-2 py-0.5 text-xs font-medium text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">
                                    {count}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {action && (
                    <div className="flex shrink-0 items-center gap-2 sm:pt-0.5">
                        {action}
                    </div>
                )}
            </div>
            <div className={clsx('p-5', bodyClassName)}>
                {children}
            </div>
        </section>
    );
}

export function ContractSectionLoading({ label }: ContractSectionLoadingProps) {
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border border-brand-slate/10 bg-brand-light/60 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/70">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-mint/30 border-t-transparent" />
            {label && <span>{label}</span>}
        </div>
    );
}

export function ContractSectionEmpty({ icon: Icon, title, description, action }: ContractSectionEmptyProps) {
    return (
        <div className="rounded-lg border border-dashed border-brand-slate/20 bg-brand-light/70 px-6 py-12 text-center dark:border-brand-light/10 dark:bg-brand-light/5">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint">
                <Icon size={24} />
            </span>
            <p className="mt-4 text-sm font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                {title}
            </p>
            {description && (
                <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-brand-slate dark:text-brand-light/70">
                    {description}
                </p>
            )}
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </div>
    );
}

export function ContractSectionAlert({ children }: ContractSectionAlertProps) {
    return (
        <div className="rounded-lg border border-brand-slate/20 bg-brand-slate/5 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
            {children}
        </div>
    );
}
