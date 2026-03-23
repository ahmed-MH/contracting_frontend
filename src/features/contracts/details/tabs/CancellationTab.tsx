import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import { useContractCancellation, useDeleteContractCancellation } from '../../hooks/useContractCancellation';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Plus, ShieldAlert } from 'lucide-react';
import type { ContractCancellationRule } from '../../../catalog/cancellation/types/cancellation.types';
import ContractCancellationModal from '../modals/ContractCancellationModal';
import ImportCancellationModal from '../modals/ImportCancellationModal';
import CancellationGrid from '../components/CancellationGrid';

export default function CancellationTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const { data: rules, isLoading, isError, refetch } = useContractCancellation(contract.id);
    const deleteMutation = useDeleteContractCancellation(contract.id);
    const { confirm } = useConfirm();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<ContractCancellationRule | null>(null);

    const handleDelete = async (rule: ContractCancellationRule) => {
        if (await confirm({
            title: 'Supprimer la règle d\'annulation ?',
            description: `La règle "${rule.name}" sera définitivement supprimée de ce contrat.`,
            confirmLabel: 'Supprimer',
            variant: 'danger'
        })) {
            deleteMutation.mutate(rule.id);
        }
    };

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
                Impossible de charger les règles d'annulation.
            </div>
        );
    }

    const items = rules ?? [];

    return (
        <>
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ShieldAlert size={20} className="text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Règles d'Annulation</h2>
                    <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                    <Plus size={16} /> Importer depuis le Catalogue
                </button>
            </div>

            {/* ─── Empty State ────────────────────────────────────────── */}

            {items.length === 0 ? (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <ShieldAlert size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune règle d'annulation dans ce contrat</p>
                    <p className="text-gray-400 text-xs mt-1">Importez depuis le catalogue pour commencer</p>
                </div>
            ) : (
                <CancellationGrid
                    contractId={contract.id}
                    rules={items}
                    periods={contract.periods || []}
                    onSaved={() => refetch()}
                    onEdit={(rule) => { setEditingRule(rule); setIsEditModalOpen(true); }}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                />
            )}

            <ContractCancellationModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingRule(null); }}
                contract={contract}
                editItem={editingRule}
            />

            <ImportCancellationModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                contractId={contract.id}
            />
        </>
    );
}
