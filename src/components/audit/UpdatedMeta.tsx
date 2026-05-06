import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { formatAuditDateTime, resolveAuditLocale } from './audit-format';

interface UpdatedMetaProps {
    updatedByName?: string | null;
    updatedAt?: string | null;
    className?: string;
    label?: string | false;
    tone?: 'surface' | 'dark' | 'plain';
}

export default function UpdatedMeta({
    updatedByName,
    updatedAt,
    className,
    label,
    tone = 'surface',
}: UpdatedMetaProps) {
    const { t, i18n } = useTranslation('common');
    const locale = resolveAuditLocale(i18n.language);
    const actor = updatedByName?.trim() || t('common.traceability.system', { defaultValue: 'System' });
    const timestamp = formatAuditDateTime(updatedAt, locale) ?? '\u2014';
    const resolvedLabel = label === false
        ? null
        : label ?? t('common.traceability.updatedLabel', { defaultValue: 'Last update' });

    const styles = {
        surface: {
            container: 'rounded-2xl border border-brand-light/70 bg-brand-light/72 px-4 py-3 dark:border-brand-light/10 dark:bg-brand-light/5',
            label: 'text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-slate',
            actor: 'mt-2 text-sm font-semibold leading-5 text-brand-navy dark:text-brand-light',
            date: 'mt-1 text-xs font-medium text-brand-slate dark:text-brand-light/65',
        },
        dark: {
            container: 'rounded-2xl border border-white/10 bg-white/5 px-4 py-3',
            label: 'text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-light/45',
            actor: 'mt-2 text-sm font-semibold leading-5 text-brand-light',
            date: 'mt-1 text-xs font-medium text-brand-light/55',
        },
        plain: {
            container: '',
            label: 'text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-slate dark:text-brand-light/55',
            actor: 'mt-1 text-sm font-semibold leading-5 text-brand-navy dark:text-brand-light',
            date: 'mt-1 text-xs font-medium text-brand-slate dark:text-brand-light/65',
        },
    }[tone];

    return (
        <div className={clsx(styles.container, className)}>
            {resolvedLabel && <p className={styles.label}>{resolvedLabel}</p>}
            <p className={styles.actor}>{actor}</p>
            <p className={styles.date}>{timestamp}</p>
        </div>
    );
}
