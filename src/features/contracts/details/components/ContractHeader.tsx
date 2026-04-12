import { ArrowLeft, Calendar, FileText, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Contract } from '../../types/contract.types';
import StatusDropdown from '../../components/StatusDropdown';

interface Props {
    contract: Contract;
    onBack: () => void;
}

export default function ContractHeader({ contract, onBack }: Props) {
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';

    const formatDate = (iso: string): string =>
        new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

    const affiliates = contract.affiliates ?? [];
    const shownAffiliates = affiliates.slice(0, 2).map((affiliate) => affiliate.companyName).join(', ');

    return (
        <section className="premium-surface relative overflow-hidden p-6 md:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-brand-mint/10 dark:bg-brand-navy/80" />
            <div className="relative">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-sm font-semibold text-brand-slate transition hover:text-brand-navy dark:border-white/10 dark:bg-white/5 dark:text-brand-light/75 dark:hover:text-white"
                >
                    <ArrowLeft size={16} />
                    {t('pages.contractDetails.header.backToContracts', { defaultValue: 'Back to contracts' })}
                </button>

                <div className="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-slate">
                            {t('pages.contractDetails.header.eyebrow', { defaultValue: 'Contract Workspace' })}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <div className="rounded-2xl bg-brand-mint/12 p-3 text-brand-mint">
                                <FileText size={20} />
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-brand-navy dark:text-white">
                                {contract.name}
                            </h1>
                            <StatusDropdown contractId={contract.id} currentStatus={contract.status} size="md" />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-brand-slate dark:text-brand-light/75">
                            <span className="inline-flex items-center rounded-full border border-white/70 bg-white/72 px-3 py-1 font-mono text-xs dark:border-white/10 dark:bg-white/5">
                                {contract.reference || `#${contract.id}`}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 py-1 dark:border-white/10 dark:bg-white/5">
                                <Users size={14} className="text-brand-mint" />
                                {affiliates.length === 0 ? t('common.notAvailable', { defaultValue: 'N/A' }) : shownAffiliates}
                                {affiliates.length > 2 && <span className="text-brand-mint">+{affiliates.length - 2}</span>}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 py-1 dark:border-white/10 dark:bg-white/5">
                                <Calendar size={14} className="text-brand-mint" />
                                {formatDate(contract.startDate)} to {formatDate(contract.endDate)}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-brand-navy px-3 py-1 text-xs font-semibold text-white dark:bg-white/10">
                                {contract.currency}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
