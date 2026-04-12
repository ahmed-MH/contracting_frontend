import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import { useAffiliateContracts } from '../hooks/useAffiliates';
import type { ContractStatus } from '../../contracts/types/contract.types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    affiliateId: number | null;
    affiliateName: string;
}

export default function ViewAffiliateContractsModal({
    isOpen,
    onClose,
    affiliateId,
    affiliateName,
}: Props) {
    const { data: contracts, isLoading } = useAffiliateContracts(affiliateId);
    const { t, i18n } = useTranslation('common');
    const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';

    const formatDate = (iso: string): string => {
        const d = new Date(iso);
        return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const statusBadge = (startDate: string, endDate: string, backendStatus: ContractStatus): { label: string; color: string } => {
        if (backendStatus === 'TERMINATED') {
            return {
                label: t('pages.affiliates.contractsModal.status.terminated', { defaultValue: 'Terminated' }),
                color: 'bg-brand-light text-brand-navy',
            };
        }
        if (backendStatus === 'DRAFT') {
            return {
                label: t('pages.affiliates.contractsModal.status.draft', { defaultValue: 'Draft' }),
                color: 'bg-brand-light text-brand-slate',
            };
        }

        const now = new Date();
        const end = new Date(endDate);
        const start = new Date(startDate);

        if (now > end) {
            return {
                label: t('pages.affiliates.contractsModal.status.expired', { defaultValue: 'Expired' }),
                color: 'bg-brand-slate/10 text-brand-slate',
            };
        }
        if (now >= start && now <= end) {
            return {
                label: t('pages.affiliates.contractsModal.status.active', { defaultValue: 'Active' }),
                color: 'bg-brand-mint/10 text-brand-mint',
            };
        }
        return {
            label: t('pages.affiliates.contractsModal.status.upcoming', { defaultValue: 'Upcoming' }),
            color: 'bg-brand-mint/10 text-brand-mint',
        };
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pages.affiliates.contractsModal.title', {
                defaultValue: 'Contracts for {{name}}',
                name: affiliateName,
            })}
            maxWidth="max-w-2xl"
        >
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-mint border-t-transparent" />
                </div>
            )}

            {!isLoading && (!contracts || contracts.length === 0) && (
                <div className="text-center py-12">
                    <FileText size={36} className="mx-auto text-brand-slate/30 mb-3" />
                    <p className="text-sm text-brand-slate">
                        {t('pages.affiliates.contractsModal.empty', { defaultValue: 'No contracts linked to this partner yet.' })}
                    </p>
                </div>
            )}

            {!isLoading && contracts && contracts.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-brand-slate/15 dark:border-brand-slate/20">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light dark:bg-brand-slate/10 border-b border-brand-slate/15 dark:border-brand-slate/20">
                                <th className="px-4 py-2.5 font-semibold text-brand-slate text-xs uppercase tracking-wide">
                                    {t('pages.affiliates.contractsModal.table.name', { defaultValue: 'Name' })}
                                </th>
                                <th className="px-4 py-2.5 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">
                                    {t('pages.affiliates.contractsModal.table.dates', { defaultValue: 'Dates' })}
                                </th>
                                <th className="px-4 py-2.5 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">
                                    {t('pages.affiliates.contractsModal.table.status', { defaultValue: 'Status' })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10 dark:divide-brand-slate/20">
                            {contracts.map((c) => {
                                const st = statusBadge(c.startDate, c.endDate, c.status);
                                return (
                                    <tr key={c.id} className="hover:bg-brand-light dark:hover:bg-brand-slate/5 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-brand-navy dark:text-brand-light">{c.name}</span>
                                                <span className="text-xs text-brand-slate mt-0.5 font-mono tracking-wide">{c.reference || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-brand-slate">
                                            {formatDate(c.startDate)} → {formatDate(c.endDate)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>
                                                {st.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}
