import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('common');

    const handleDelete = async (reduction: ContractReduction) => {
        if (await confirm({
            title: t('pages.contractDetails.reductions.deleteTitle', {
                defaultValue: 'Delete reduction \"{{name}}\"?',
                name: reduction.name,
            }),
            description: t('pages.contractDetails.reductions.deleteDescription', {
                defaultValue: 'This reduction will be permanently removed from this contract.',
            }),
            confirmLabel: t('pages.contractDetails.reductions.deleteConfirm', { defaultValue: 'Delete' }),
            variant: 'danger',
        })) {
            deleteMutation.mutate(reduction.id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
            </div>
        );
    }

    const items = reductions ?? [];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Baby size={20} className="text-brand-mint" />
                    <h2 className="text-base font-semibold text-brand-navy">
                        {t('pages.contractDetails.reductions.title', { defaultValue: 'Reductions' })}
                    </h2>
                    <span className="text-xs text-brand-slate">({items.length})</span>
                </div>
                <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-mint rounded-xl hover:bg-brand-mint transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    {t('pages.contractDetails.reductions.importFromCatalog', { defaultValue: 'Import from Catalog' })}
                </button>
            </div>

            {items.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <Baby size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">
                        {t('pages.contractDetails.reductions.emptyTitle', { defaultValue: 'No reductions in this contract' })}
                    </p>
                    <p className="text-brand-slate text-xs mt-1">
                        {t('pages.contractDetails.reductions.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    </p>
                </div>
            )}

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

            <ImportReductionModal
                contractId={contract.id}
                isOpen={showImport}
                onClose={() => setShowImport(false)}
            />

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
