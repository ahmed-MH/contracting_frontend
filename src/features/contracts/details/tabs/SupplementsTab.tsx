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
import { ContractSectionEmpty, ContractSectionLoading, ContractSectionShell } from '../components/ContractSection';

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

    const importAction = (
        <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-medium text-brand-light shadow-sm transition-colors hover:bg-brand-mint/90"
        >
            <Plus size={16} />
            {t('pages.contractDetails.supplements.importFromCatalog', { defaultValue: 'Import from Catalog' })}
        </button>
    );

    if (isLoading) {
        return (
            <ContractSectionShell
                icon={Package}
                title={t('pages.contractDetails.supplements.title', { defaultValue: 'Supplements' })}
                description={t('pages.contractDetails.supplements.description', {
                    defaultValue: 'Attach room, period, or price-linked supplements to this contract.',
                })}
                action={importAction}
            >
                <ContractSectionLoading label={t('states.loading', { defaultValue: 'Loading...' })} />
            </ContractSectionShell>
        );
    }

    const items = supplements ?? [];

    return (
        <>
            <ContractSectionShell
                icon={Package}
                title={t('pages.contractDetails.supplements.title', { defaultValue: 'Supplements' })}
                description={t('pages.contractDetails.supplements.description', {
                    defaultValue: 'Attach room, period, or price-linked supplements to this contract.',
                })}
                count={items.length}
                action={importAction}
            >
                {items.length === 0 ? (
                    <ContractSectionEmpty
                        icon={Package}
                        title={t('pages.contractDetails.supplements.emptyTitle', { defaultValue: 'No supplements in this contract' })}
                        description={t('pages.contractDetails.supplements.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    />
                ) : (
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
            </ContractSectionShell>

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
