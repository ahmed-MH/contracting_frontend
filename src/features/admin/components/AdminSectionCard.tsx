import type { ReactNode } from 'react';

interface AdminSectionCardProps {
    eyebrow: string;
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
}

export default function AdminSectionCard({
    eyebrow,
    title,
    description,
    actions,
    children,
}: AdminSectionCardProps) {
    return (
        <section className="premium-surface p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                        {eyebrow}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                            {description}
                        </p>
                    )}
                </div>
                {actions}
            </div>

            <div className="mt-6">{children}</div>
        </section>
    );
}
