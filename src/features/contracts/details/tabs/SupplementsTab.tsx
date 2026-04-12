import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import {
    useContractSupplements,
    useDeleteContractSupplement,
} from '../../hooks/useContractSupplements';
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
    const { t } = useTranslation('common');

    const { data: contractLines, isLoading: isLoadingLines } = useQuery({
        queryKey: ['contract-lines', contract.id],
        queryFn: () => contractService.getContractPrices(contract.id),
    });

    const isLoading = isLoadingSupplements || isLoadingLines;

    const handleDelete = async (supplement: ContractSupplement) => {
        if (await confirm({
            title: t('pages.contractDetails.supplements.deleteTitle', {
                defaultValue: 'Delete supplement \"{{name}}\"?',
                name: supplement.name,
            }),
            description: t('pages.contractDetails.supplements.deleteDescription', {
                defaultValue: 'This supplement will be permanently removed from this contract.',
            }),
            confirmLabel: t('pages.contractDetails.supplements.deleteConfirm', { defaultValue: 'Delete' }),
            variant: 'danger',
        })) {
            deleteMutation.mutate(supplement.id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
            </div>
        );
    }

    const items = supplements ?? [];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Package size={20} className="text-brand-mint" />
                    <h2 className="text-base font-semibold text-brand-navy">
                        {t('pages.contractDetails.supplements.title', { defaultValue: 'Supplements' })}
                    </h2>
                    <span className="text-xs text-brand-slate">({items.length})</span>
                </div>
                <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-mint rounded-xl hover:bg-brand-mint transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    {t('pages.contractDetails.supplements.importFromCatalog', { defaultValue: 'Import from Catalog' })}
                </button>
            </div>

            {items.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <Package size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">
                        {t('pages.contractDetails.supplements.emptyTitle', { defaultValue: 'No supplements in this contract' })}
                    </p>
                    <p className="text-brand-slate text-xs mt-1">
                        {t('pages.contractDetails.supplements.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    </p>
                </div>
            )}

            {items.length > 0 && (
                <SupplementsGrid
                    contractId={contract.id}
                    supplements={items}
                    periods={contract.periods ?? []}
                    currency={contract.currency ?? 'TND'}
                    onSaved={() => refetch()}
                    onEdit={(supplement) => setEditingSupplement(supplement)}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending}
                    contractLines={contractLines ?? []}
                />
            )}

            <ImportSupplementModal
                contractId={contract.id}
                isOpen={showImport}
                onClose={() => setShowImport(false)}
            />

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
