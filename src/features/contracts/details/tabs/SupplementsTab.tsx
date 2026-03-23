import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import {
    useContractSupplements,
    useDeleteContractSupplement,
} from '../../hooks/useContractSupplements';
import { useQuery } from '@tanstack/react-query';
import { contractService } from '../../services/contract.service';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Package, Plus } from 'lucide-react';
import type { ContractSupplement } from '../../../../types';
import ImportSupplementModal from '../../../catalog/supplements/components/ImportSupplementModal';
import EditContractSupplementModal from '../modals/EditContractSupplementModal';
import SupplementsGrid from '../components/SupplementsGrid';

export default function SupplementsTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const [showImport, setShowImport] = useState(false);
    const [editingSupplement, setEditingSupplement] = useState<ContractSupplement | null>(null);
    const { data: supplements, isLoading: isLoadingSupplements, refetch } = useContractSupplements(contract.id);
    const deleteMutation = useDeleteContractSupplement(contract.id);
    const { confirm } = useConfirm();

    // Fetch contract lines to know which rooms are contracted per period
    const { data: contractLines, isLoading: isLoadingLines } = useQuery({
        queryKey: ['contract-lines', contract.id],
        queryFn: () => contractService.getContractPrices(contract.id),
    });

    const isLoading = isLoadingSupplements || isLoadingLines;

    const handleDelete = async (s: ContractSupplement) => {
        if (await confirm({
            title: `Supprimer le supplément "${s.name}" ?`,
            description: 'Le supplément sera définitivement supprimé de ce contrat.',
            confirmLabel: 'Supprimer',
            variant: 'danger',
        })) {
            deleteMutation.mutate(s.id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    const items = supplements ?? [];

    return (
        <>
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Package size={20} className="text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Suppléments</h2>
                    <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                    <Plus size={16} /> Importer depuis le Catalogue
                </button>
            </div>

            {/* ─── Empty State ─────────────────────────────────────────── */}
            {items.length === 0 && (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <Package size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucun supplément dans ce contrat</p>
                    <p className="text-gray-400 text-xs mt-1">Importez depuis le catalogue pour commencer</p>
                </div>
            )}

            {/* ─── Matrice Saisonnière (interface unique) ──────────────── */}
            {items.length > 0 && (
                <SupplementsGrid
                    contractId={contract.id}
                    supplements={items}
                    periods={contract.periods ?? []}
                    currency={contract.currency ?? 'TND'}
                    onSaved={() => refetch()}
                    onEdit={(s) => setEditingSupplement(s)}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                    contractLines={contractLines ?? []}
                />
            )}

            {/* ─── Import Modal ────────────────────────────────────────── */}
            <ImportSupplementModal
                contractId={contract.id}
                isOpen={showImport}
                onClose={() => setShowImport(false)}
            />

            {/* ─── Edit Modal ──────────────────────────────────────────── */}
            {editingSupplement && (
                <EditContractSupplementModal
                    contractId={contract.id}
                    supplement={editingSupplement}
                    isOpen={!!editingSupplement}
                    onClose={() => setEditingSupplement(null)}
                    contractRooms={contract.contractRooms ?? []}
                />
            )}
        </>
    );
}
