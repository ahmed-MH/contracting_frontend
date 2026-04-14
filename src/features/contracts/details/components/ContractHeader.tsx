import { ArrowLeft, AlertTriangle, Calendar, CheckCircle2, Download, FileText, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Contract } from '../../types/contract.types';
import { useContractActivationCheck } from '../../hooks/useContracts';
import StatusDropdown from '../../components/StatusDropdown';

interface Props {
    contract: Contract;
    onBack: () => void;
}

function ContractReadiness({ contract }: { contract: Contract }) {
    const { t } = useTranslation('common');
    const { data, isLoading } = useContractActivationCheck(contract.id, true);
    const errors = data?.errors ?? [];
    const invalidTargets = data?.summary.invalidTargets ?? [];

    const hasErrorCode = (tokens: string[]) =>
        errors.some((error) => tokens.some((token) => error.code.includes(token)));

    const readinessItems = [
        {
            label: t('pages.contractDetails.readiness.periods', { defaultValue: 'Periods' }),
            ready: data
                ? !data.summary.missingPeriods && data.summary.uncoveredDateRanges.length === 0 && !hasErrorCode(['PERIOD', 'DATE_RANGE'])
                : contract.periods.length > 0,
            issue: data?.summary.missingPeriods
                ? t('pages.contractDetails.readiness.missing', { defaultValue: 'Missing' })
                : data?.summary.uncoveredDateRanges.length
                    ? t('pages.contractDetails.readiness.gaps', { defaultValue: 'Gaps' })
                    : undefined,
        },
        {
            label: t('pages.contractDetails.readiness.rooms', { defaultValue: 'Rooms' }),
            ready: data
                ? !data.summary.missingRooms && !invalidTargets.some((issue) => issue.code.includes('ROOM'))
                : contract.contractRooms.length > 0,
            issue: data?.summary.missingRooms
                ? t('pages.contractDetails.readiness.missing', { defaultValue: 'Missing' })
                : undefined,
        },
        {
            label: t('pages.contractDetails.readiness.rates', { defaultValue: 'Rates' }),
            ready: data ? data.summary.missingRates.length === 0 && !hasErrorCode(['MISSING_RATE']) : false,
            issue: data?.summary.missingRates.length
                ? t('pages.contractDetails.readiness.missingValues', { defaultValue: 'Missing values' })
                : undefined,
        },
        {
            label: t('pages.contractDetails.readiness.rules', { defaultValue: 'Rules' }),
            ready: data ? invalidTargets.length === 0 : true,
            issue: invalidTargets.length
                ? t('pages.contractDetails.readiness.invalidTargets', { defaultValue: 'Invalid targets' })
                : undefined,
        },
    ];

    const completedCount = readinessItems.filter((item) => item.ready).length;
    const firstIssue = readinessItems.find((item) => !item.ready)?.issue;
    const stateLabel = isLoading
        ? t('pages.contractDetails.readiness.checkingShort', { defaultValue: 'Checking' })
        : data?.isValid
            ? t('pages.contractDetails.readiness.ready', { defaultValue: 'Ready for activation' })
            : firstIssue ?? t('pages.contractDetails.readiness.needsReview', { defaultValue: 'Needs review' });

    return (
        <div className="w-full rounded-lg border border-brand-slate/15 bg-brand-light/76 px-4 py-3 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5 xl:w-[360px]">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                        {t('pages.contractDetails.readiness.title', { defaultValue: 'Contract readiness' })}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-brand-navy dark:text-brand-light">
                        {stateLabel}
                    </p>
                </div>
                <span className={clsx(
                    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    data?.isValid ? 'bg-brand-mint/12 text-brand-mint' : 'bg-brand-slate/10 text-brand-slate',
                )}>
                    {data?.isValid ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-slate/10 dark:bg-brand-light/10"
                    role="progressbar"
                    aria-valuenow={completedCount}
                    aria-valuemin={0}
                    aria-valuemax={readinessItems.length}
                    aria-label={t('pages.contractDetails.readiness.title', { defaultValue: 'Contract readiness' })}
                >
                    <div
                        className="h-full rounded-full bg-brand-mint transition-all"
                        style={{ width: `${(completedCount / readinessItems.length) * 100}%` }}
                    />
                </div>
                <span className="shrink-0 text-xs font-semibold text-brand-slate">
                    {completedCount}/{readinessItems.length}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {readinessItems.map((item) => (
                    <span
                        key={item.label}
                        className={clsx(
                            'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold',
                            item.ready
                                ? 'bg-brand-mint/10 text-brand-mint'
                                : 'bg-brand-slate/10 text-brand-slate dark:bg-brand-light/10',
                        )}
                    >
                        {item.ready ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function ContractHeader({ contract, onBack }: Props) {
    const { t, i18n } = useTranslation('common');
    const navigate = useNavigate();
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';

    const formatDate = (iso: string): string =>
        new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

    const affiliates = contract.affiliates ?? [];
    const shownAffiliates = affiliates.slice(0, 2).map((affiliate) => affiliate.companyName).join(', ');

    return (
        <section className="relative overflow-hidden rounded-lg border border-brand-slate/15 bg-brand-light p-5 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5 md:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-brand-mint/10 dark:bg-brand-navy/80" />
            <div className="relative">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-lg border border-brand-slate/15 bg-brand-light/70 px-3 py-2 text-sm font-semibold text-brand-slate transition hover:text-brand-navy dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75 dark:hover:text-brand-light"
                    >
                        <ArrowLeft size={16} />
                        {t('pages.contractDetails.header.backToContracts', { defaultValue: 'Back to contracts' })}
                    </button>
                    <button
                        id="contract-export-pdf-btn"
                        type="button"
                        onClick={() => navigate(`/contracts/${contract.id}/preview`)}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-semibold text-brand-light transition hover:-translate-y-0.5 hover:bg-brand-mint/90 hover:shadow-md"
                    >
                        <Download size={16} />
                        {t('pages.contractDetails.header.exportPdf', { defaultValue: 'Export PDF' })}
                    </button>
                </div>

                <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.contractDetails.header.eyebrow', { defaultValue: 'Contract Workspace' })}
                        </p>
                        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                            <div className="shrink-0 rounded-lg bg-brand-mint/12 p-3 text-brand-mint">
                                <FileText size={20} />
                            </div>
                            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-brand-navy dark:text-brand-light md:text-3xl">
                                {contract.name}
                            </h1>
                            </div>
                            <StatusDropdown contractId={contract.id} currentStatus={contract.status} size="md" />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-brand-slate dark:text-brand-light/75">
                            <span className="inline-flex items-center rounded-lg border border-brand-slate/10 bg-brand-light/72 px-3 py-1.5 font-mono text-xs dark:border-brand-light/10 dark:bg-brand-light/5">
                                {contract.reference || `#${contract.id}`}
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-brand-slate/10 bg-brand-light/72 px-3 py-1.5 dark:border-brand-light/10 dark:bg-brand-light/5">
                                <Users size={14} className="text-brand-mint" />
                                <span className="truncate">{affiliates.length === 0 ? t('common.notAvailable', { defaultValue: 'N/A' }) : shownAffiliates}</span>
                                {affiliates.length > 2 && <span className="text-brand-mint">+{affiliates.length - 2}</span>}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-lg border border-brand-slate/10 bg-brand-light/72 px-3 py-1.5 dark:border-brand-light/10 dark:bg-brand-light/5">
                                <Calendar size={14} className="text-brand-mint" />
                                {t('pages.contractDetails.header.dateRange', {
                                        defaultValue: '{{start}} – {{end}}',
                                        start: formatDate(contract.startDate),
                                        end: formatDate(contract.endDate),
                                    })}
                            </span>
                            <span className="inline-flex items-center rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-brand-light dark:bg-brand-light/10">
                                {contract.currency}
                            </span>
                        </div>
                    </div>
                    <ContractReadiness contract={contract} />
                </div>
            </div>
        </section>
    );
}
