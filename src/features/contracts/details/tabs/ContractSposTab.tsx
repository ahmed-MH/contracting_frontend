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
import { ContractSectionAlert, ContractSectionEmpty, ContractSectionLoading, ContractSectionShell } from '../components/ContractSection';

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

    const importAction = (
        <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-medium text-brand-light shadow-sm transition-colors hover:bg-brand-mint/90"
        >
            <Plus size={16} />
            {t('pages.contractDetails.spos.importFromCatalog', { defaultValue: 'Import from Catalog' })}
        </button>
    );

    const isLoading = isLoadingSpos || isLoadingLines;

    if (isLoading) {
        return (
            <ContractSectionShell
                icon={Gift}
                title={t('pages.contractDetails.spos.title', { defaultValue: 'Special Offers (SPO)' })}
                description={t('pages.contractDetails.spos.description', {
                    defaultValue: 'Attach special offers and configure their dates, rooms, and pricing links.',
                })}
                action={importAction}
            >
                <ContractSectionLoading label={t('states.loading', { defaultValue: 'Loading...' })} />
            </ContractSectionShell>
        );
    }

    if (isError) {
        return (
            <ContractSectionShell
                icon={Gift}
                title={t('pages.contractDetails.spos.title', { defaultValue: 'Special Offers (SPO)' })}
                description={t('pages.contractDetails.spos.description', {
                    defaultValue: 'Attach special offers and configure their dates, rooms, and pricing links.',
                })}
                action={importAction}
            >
                <ContractSectionAlert>
                    {t('pages.contractDetails.spos.loadError', { defaultValue: 'Unable to load special offers.' })}
                </ContractSectionAlert>
            </ContractSectionShell>
        );
    }

    const items = spos ?? [];

    return (
        <>
            <ContractSectionShell
                icon={Gift}
                title={t('pages.contractDetails.spos.title', { defaultValue: 'Special Offers (SPO)' })}
                description={t('pages.contractDetails.spos.description', {
                    defaultValue: 'Attach special offers and configure their dates, rooms, and pricing links.',
                })}
                count={items.length}
                action={importAction}
            >
                {items.length === 0 ? (
                    <ContractSectionEmpty
                        icon={Gift}
                        title={t('pages.contractDetails.spos.emptyTitle', { defaultValue: 'No special offers in this contract' })}
                        description={t('pages.contractDetails.spos.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    />
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
            </ContractSectionShell>

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
        </>
    );
}
