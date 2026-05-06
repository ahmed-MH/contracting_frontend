import { clsx } from 'clsx';
import { Clock3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatAuditDateTime, resolveAuditLocale } from './audit-format';

interface UpdatedByCellProps {
    updatedByName?: string | null;
    updatedAt?: string | null;
    className?: string;
}

export default function UpdatedByCell({
    updatedByName,
    updatedAt,
    className,
}: UpdatedByCellProps) {
    const { t, i18n } = useTranslation('common');
    const locale = resolveAuditLocale(i18n.language);
    const actor = updatedByName?.trim() || t('common.traceability.system', { defaultValue: 'System' });
    const timestamp = formatAuditDateTime(updatedAt, locale) ?? '\u2014';

    return (
        <div className={clsx('flex min-w-[150px] flex-col gap-1.5', className)}>
            <span className="text-sm font-medium leading-5 text-brand-navy dark:text-brand-light">
                {actor}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium leading-4 text-brand-slate dark:text-brand-light/55">
                <Clock3 size={11} className="shrink-0 opacity-70" />
                {timestamp}
            </span>
        </div>
    );
}
