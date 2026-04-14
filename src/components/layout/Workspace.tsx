import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface WorkspaceContainerProps {
    children: ReactNode;
    className?: string;
}

interface PageHeaderProps {
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
    className?: string;
}

interface SectionCardProps {
    title?: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
}

interface ActionBarProps {
    children: ReactNode;
    className?: string;
}

interface GuidedPageHeaderProps {
    kicker?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    icon: LucideIcon;
    actions?: ReactNode;
    toolbar?: ReactNode;
    className?: string;
}

export function WorkspaceContainer({ children, className }: WorkspaceContainerProps) {
    return (
        <div className={clsx('mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8', className)}>
            {children}
        </div>
    );
}

export function PageHeader({ eyebrow, title, description, actions, children, className }: PageHeaderProps) {
    return (
        <header className={clsx('flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between', className)}>
            <div className="min-w-0">
                {eyebrow && (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-slate">
                        {eyebrow}
                    </p>
                )}
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-navy sm:text-3xl dark:text-brand-light">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                        {description}
                    </p>
                )}
                {children}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                    {actions}
                </div>
            )}
        </header>
    );
}

export function SectionCard({ title, description, action, children, className, bodyClassName }: SectionCardProps) {
    const hasHeader = title || description || action;

    return (
        <section className={clsx('rounded-lg border border-brand-slate/15 bg-brand-light shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5', className)}>
            {hasHeader && (
                <div className="flex flex-col gap-3 border-b border-brand-slate/10 px-5 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-brand-light/10">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="text-lg font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-1 text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                                {description}
                            </p>
                        )}
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            )}
            <div className={clsx('p-5', bodyClassName)}>
                {children}
            </div>
        </section>
    );
}

export function ActionBar({ children, className }: ActionBarProps) {
    return (
        <div className={clsx('flex flex-col gap-3 rounded-lg border border-brand-slate/15 bg-brand-light/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-brand-light/10 dark:bg-brand-light/5', className)}>
            {children}
        </div>
    );
}

export function GuidedPageHeader({ kicker, title, description, icon: Icon, actions, toolbar, className }: GuidedPageHeaderProps) {
    return (
        <section className={clsx('premium-surface relative overflow-hidden p-5 md:p-6', className)}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-brand-mint/10 dark:bg-brand-mint/8" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    {kicker && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {kicker}
                        </p>
                    )}
                    <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-mint/10 text-brand-mint">
                            <Icon size={24} />
                        </span>
                        <span>{title}</span>
                    </h1>
                    {description && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-9">
                        {actions}
                    </div>
                )}
            </div>
            {toolbar && (
                <div className="relative mt-5 border-t border-brand-slate/10 pt-5 dark:border-brand-light/10">
                    {toolbar}
                </div>
            )}
        </section>
    );
}
