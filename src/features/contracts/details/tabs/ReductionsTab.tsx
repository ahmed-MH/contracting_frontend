import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import {
    useContractReductions,
    useDeleteContractReduction,
    type ContractReduction,
} from '../../hooks/useContractReductions';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Baby, Plus } from 'lucide-react';
import ImportReductionModal from '../../../catalog/reductions/components/ImportReductionModal';
import EditContractReductionModal from '../modals/EditContractReductionModal';
import ReductionsGrid from '../components/ReductionsGrid';



export default function ReductionsTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const [showImport, setShowImport] = useState(false);
    const [editingReduction, setEditingReduction] = useState<ContractReduction | null>(null);
    const { data: reductions, isLoading, refetch } = useContractReductions(contract.id);
    const deleteMutation = useDeleteContractReduction(contract.id);
    const { confirm } = useConfirm();

    const handleDelete = async (r: ContractReduction) => {
        if (await confirm({
            title: `Supprimer la réduction "${r.name}" ?`,
            description: 'La réduction sera définitivement supprimée de ce contrat.',
            confirmLabel: 'Supprimer',
            variant: 'danger',
        })) {
            deleteMutation.mutate(r.id);
        }
    };



    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    const items = reductions ?? [];

    return (
        <>
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Baby size={20} className="text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Réductions</h2>
                    <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <button onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
                    <Plus size={16} /> Importer depuis le Catalogue
                </button>
            </div>

            {/* ─── Empty State ────────────────────────────────────────── */}
            {items.length === 0 && (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <Baby size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune réduction dans ce contrat</p>
                    <p className="text-gray-400 text-xs mt-1">Importez depuis le catalogue pour commencer</p>
                </div>
            )}

            {/* ─── Grid ──────────────────────────────────────────────── */}
            {items.length > 0 && (
                <ReductionsGrid
                    contractId={contract.id}
                    reductions={items}
                    periods={contract.periods ?? []}
                    onSaved={() => refetch()}
                    onEdit={setEditingReduction}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                />
            )}

            {/* ─── Import Modal ───────────────────────────────────────── */}
            <ImportReductionModal
                contractId={contract.id}
                isOpen={showImport}
                onClose={() => setShowImport(false)}
            />

            {/* ─── Edit Modal (with targeting) ────────────────────────── */}
            {editingReduction && (
                <EditContractReductionModal
                    contractId={contract.id}
                    reduction={editingReduction}
                    isOpen={!!editingReduction}
                    onClose={() => setEditingReduction(null)}
                    contractRooms={contract.contractRooms ?? []}
                    periods={contract.periods ?? []}
                />
            )}
        </>
    );
}


