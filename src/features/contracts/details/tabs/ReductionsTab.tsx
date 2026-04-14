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
import { ContractSectionEmpty, ContractSectionLoading, ContractSectionShell } from '../components/ContractSection';

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

    const importAction = (
        <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-medium text-brand-light shadow-sm transition-colors hover:bg-brand-mint/90"
        >
            <Plus size={16} />
            {t('pages.contractDetails.reductions.importFromCatalog', { defaultValue: 'Import from Catalog' })}
        </button>
    );

    if (isLoading) {
        return (
            <ContractSectionShell
                icon={Baby}
                title={t('pages.contractDetails.reductions.title', { defaultValue: 'Reductions' })}
                description={t('pages.contractDetails.reductions.description', {
                    defaultValue: 'Apply commercial reductions and child pricing rules to this contract.',
                })}
                action={importAction}
            >
                <ContractSectionLoading label={t('states.loading', { defaultValue: 'Loading...' })} />
            </ContractSectionShell>
        );
    }

    const items = reductions ?? [];

    return (
        <>
            <ContractSectionShell
                icon={Baby}
                title={t('pages.contractDetails.reductions.title', { defaultValue: 'Reductions' })}
                description={t('pages.contractDetails.reductions.description', {
                    defaultValue: 'Apply commercial reductions and child pricing rules to this contract.',
                })}
                count={items.length}
                action={importAction}
            >
                {items.length === 0 ? (
                    <ContractSectionEmpty
                        icon={Baby}
                        title={t('pages.contractDetails.reductions.emptyTitle', { defaultValue: 'No reductions in this contract' })}
                        description={t('pages.contractDetails.reductions.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    />
                ) : (
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
            </ContractSectionShell>

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
