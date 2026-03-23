import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import {
    useContractMonoparentalRules,
    useDeleteContractMonoparentalRule,
} from '../../hooks/useContractMonoparentalRules';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Contact, Plus } from 'lucide-react';
import type { ContractMonoparentalRule } from '../../../../types';
import ImportMonoparentalRuleModal from '../../../catalog/monoparental/components/ImportMonoparentalRuleModal';
import EditContractMonoparentalRuleModal from '../modals/EditContractMonoparentalRuleModal';

import MonoparentalGrid from '../components/MonoparentalGrid';

export default function MonoparentalTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const [showImport, setShowImport] = useState(false);
    const [editingRule, setEditingRule] = useState<ContractMonoparentalRule | null>(null);
    const { data: rules, isLoading, refetch } = useContractMonoparentalRules(contract.id);
    const deleteMutation = useDeleteContractMonoparentalRule(contract.id);
    const { confirm } = useConfirm();

    const handleDelete = async (r: ContractMonoparentalRule) => {
        if (await confirm({
            title: `Supprimer la règle "${r.name}" ?`,
            description: 'La règle sera définitivement supprimée de ce contrat.',
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

    const items = rules ?? [];

    return (
        <>
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Contact size={20} className="text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-900">Règles Monoparentales</h2>
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
                    <Contact size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune règle monoparentale</p>
                    <p className="text-gray-400 text-xs mt-1">Importez depuis le catalogue pour commencer</p>
                </div>
            )}

            {/* ─── Grid ──────────────────────────────────────────────── */}
            {items.length > 0 && (
                <MonoparentalGrid
                    contractId={contract.id}
                    rules={items}
                    periods={contract.periods ?? []}
                    onSaved={() => refetch()}
                    onEdit={setEditingRule}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                />
            )}

            {/* ─── Import Modal ───────────────────────────────────────── */}
            <ImportMonoparentalRuleModal
                contractId={contract.id}
                isOpen={showImport}
                onClose={() => setShowImport(false)}
            />

            {/* ─── Edit Modal (with targeting) ────────────────────────── */}
            {editingRule && (
                <EditContractMonoparentalRuleModal
                    contractId={contract.id}
                    rule={editingRule}
                    isOpen={!!editingRule}
                    onClose={() => setEditingRule(null)}
                    contractRooms={contract.contractRooms ?? []}
                    periods={contract.periods ?? []}
                />
            )}
        </>
    );
}


