import { FileText } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { useAffiliateContracts } from '../hooks/useAffiliates';
import type { ContractStatus } from '../../contracts/types/contract.types';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusBadge(startDate: string, endDate: string, backendStatus: ContractStatus): { label: string; color: string } {
    if (backendStatus === 'TERMINATED') return { label: 'Résilié', color: 'bg-gray-100 text-gray-700' };
    if (backendStatus === 'DRAFT') return { label: 'Brouillon', color: 'bg-yellow-50 text-yellow-700' };

    const now = new Date();
    const end = new Date(endDate);
    const start = new Date(startDate);

    if (now > end) return { label: 'Expiré', color: 'bg-red-50 text-red-700' };
    if (now >= start && now <= end) return { label: 'Actif', color: 'bg-emerald-50 text-emerald-700' };
    return { label: 'À venir', color: 'bg-blue-50 text-blue-700' };
}

// ─── Component ────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    onClose: () => void;
    affiliateId: number | null;
    affiliateName: string;
}

export default function ViewAffiliateContractsModal({ isOpen, onClose, affiliateId, affiliateName }: Props) {
    const { data: contracts, isLoading } = useAffiliateContracts(affiliateId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Contrats de ${affiliateName}`} maxWidth="max-w-2xl">
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-600 border-t-transparent" />
                </div>
            )}

            {!isLoading && (!contracts || contracts.length === 0) && (
                <div className="text-center py-12">
                    <FileText size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">Aucun contrat associé à ce partenaire pour le moment.</p>
                </div>
            )}

            {!isLoading && contracts && contracts.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nom</th>
                                <th className="px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Dates</th>
                                <th className="px-4 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contracts.map((c) => {
                                const st = statusBadge(c.startDate, c.endDate, c.status);
                                return (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{c.name}</span>
                                                <span className="text-xs text-gray-400 mt-0.5 font-mono tracking-wide">{c.reference || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-gray-600">
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
