import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import { useContractSpos, useDeleteContractSpo } from '../../hooks/useContractSpos';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Plus, Gift } from 'lucide-react';
import type { ContractSpo } from '../../../catalog/spos/types/spos.types';
import ContractSpoModal from '../modals/ContractSpoModal';
import ImportContractSpoModal from '../modals/ImportContractSpoModal';
import SpoGrid from '../components/SpoGrid';
import { useQuery } from '@tanstack/react-query';
import { contractService } from '../../services/contract.service';

export default function ContractSposTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const { data: spos, isLoading: isLoadingSpos, isError, refetch } = useContractSpos(contract.id);
    const deleteMutation = useDeleteContractSpo(contract.id);
    const { confirm } = useConfirm();

    // Fetch contract lines to know which rooms are contracted per period
    const { data: contractLines, isLoading: isLoadingLines } = useQuery({
        queryKey: ['contract-lines', contract.id],
        queryFn: () => contractService.getContractPrices(contract.id),
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingSpo, setEditingSpo] = useState<ContractSpo | null>(null);

    const handleDelete = async (spo: ContractSpo) => {
        if (await confirm({
            title: 'Supprimer l\'offre spéciale ?',
            description: `L'offre spéciale "${spo.name}" sera définitivement supprimée de ce contrat.`,
            confirmLabel: 'Supprimer',
            variant: 'danger'
        })) {
            deleteMutation.mutate(spo.id);
        }
    };

    const isLoading = isLoadingSpos || isLoadingLines;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
                Impossible de charger les offres spéciales.
            </div>
        );
    }

    const items = spos ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Gift size={20} className="text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Offres Spéciales (SPO)</h2>
                    <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                        <Plus size={16} /> Importer depuis le Catalogue
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <Gift size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune offre spéciale dans ce contrat</p>
                    <p className="text-gray-400 text-xs mt-1">Importez depuis le catalogue pour commencer</p>
                </div>
            ) : (
                <SpoGrid
                    contractId={contract.id}
                    spos={items}
                    periods={contract.periods || []}
                    onSaved={() => refetch()}
                    onEdit={(spo) => { setEditingSpo(spo); setIsEditModalOpen(true); }}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                    contractLines={contractLines || []}
                />
            )}

            <ContractSpoModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingSpo(null); }}
                contract={contract}
                editItem={editingSpo}
            />

            <ImportContractSpoModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                contractId={contract.id}
            />
        </div>
    );
}
