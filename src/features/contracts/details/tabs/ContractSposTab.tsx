import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import { useContractSpos, useDeleteContractSpo } from '../../hooks/useContractSpos';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Plus, Gift } from 'lucide-react';
import type { ContractSpo } from '../../../catalog/spos/types/spos.types';
import EditContractSpoModal from '../modals/EditContractSpoModal';
import ImportContractSpoModal from '../modals/ImportContractSpoModal';
import SpoGrid from '../components/SpoGrid';
import { contractService } from '../../services/contract.service';

export default function ContractSposTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const { data: spos, isLoading: isLoadingSpos, isError, refetch } = useContractSpos(contract.id);
    const deleteMutation = useDeleteContractSpo(contract.id);
    const { confirm } = useConfirm();
    const { t } = useTranslation('common');

    const { data: contractLines, isLoading: isLoadingLines } = useQuery({
        queryKey: ['contract-lines', contract.id],
        queryFn: () => contractService.getContractPrices(contract.id),
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingSpo, setEditingSpo] = useState<ContractSpo | null>(null);

    const handleDelete = async (spo: ContractSpo) => {
        if (await confirm({
            title: t('pages.contractDetails.spos.deleteTitle', { defaultValue: 'Delete special offer?' }),
            description: t('pages.contractDetails.spos.deleteDescription', {
                defaultValue: 'The special offer "{{name}}" will be permanently removed from this contract.',
                name: spo.name,
            }),
            confirmLabel: t('pages.contractDetails.spos.deleteConfirm', { defaultValue: 'Delete' }),
            variant: 'danger',
        })) {
            deleteMutation.mutate(spo.id);
        }
    };

    const isLoading = isLoadingSpos || isLoadingLines;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-xl bg-brand-slate/10 border border-brand-slate/30 p-6 text-brand-slate text-sm">
                {t('pages.contractDetails.spos.loadError', { defaultValue: 'Unable to load special offers.' })}
            </div>
        );
    }

    const items = spos ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Gift size={20} className="text-brand-mint" />
                    <h2 className="text-base font-semibold text-brand-navy">
                        {t('pages.contractDetails.spos.title', { defaultValue: 'Special Offers (SPO)' })}
                    </h2>
                    <span className="text-xs text-brand-slate">({items.length})</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-mint rounded-xl hover:bg-brand-mint transition-colors cursor-pointer"
                    >
                        <Plus size={16} />
                        {t('pages.contractDetails.spos.importFromCatalog', { defaultValue: 'Import from Catalog' })}
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <Gift size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">
                        {t('pages.contractDetails.spos.emptyTitle', { defaultValue: 'No special offers in this contract' })}
                    </p>
                    <p className="text-brand-slate text-xs mt-1">
                        {t('pages.contractDetails.spos.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    </p>
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

            <EditContractSpoModal
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
