import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ContractOutletContext } from '../components/ContractDetailsLayout';
import { useContractCancellation, useDeleteContractCancellation } from '../../hooks/useContractCancellation';
import { useConfirm } from '../../../../context/ConfirmContext';
import { Plus, ShieldAlert } from 'lucide-react';
import type { ContractCancellationRule } from '../../../catalog/cancellation/types/cancellation.types';
import EditContractCancellationModal from '../modals/EditContractCancellationModal';
import ImportContractCancellationModal from '../modals/ImportContractCancellationModal';
import CancellationGrid from '../components/CancellationGrid';
import { ContractSectionAlert, ContractSectionEmpty, ContractSectionLoading, ContractSectionShell } from '../components/ContractSection';

export default function CancellationTab() {
    const { contract } = useOutletContext<ContractOutletContext>();
    const { data: rules, isLoading, isError, refetch } = useContractCancellation(contract.id);
    const deleteMutation = useDeleteContractCancellation(contract.id);
    const { confirm } = useConfirm();
    const { t } = useTranslation('common');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<ContractCancellationRule | null>(null);

    const handleDelete = async (rule: ContractCancellationRule) => {
        if (await confirm({
            title: t('pages.contractDetails.cancellation.deleteTitle', { defaultValue: 'Delete cancellation rule?' }),
            description: t('pages.contractDetails.cancellation.deleteDescription', {
                defaultValue: 'The rule "{{name}}" will be permanently removed from this contract.',
                name: rule.name,
            }),
            confirmLabel: t('pages.contractDetails.cancellation.deleteConfirm', { defaultValue: 'Delete' }),
            variant: 'danger',
        })) {
            deleteMutation.mutate(rule.id);
        }
    };

    const importAction = (
        <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-medium text-brand-light shadow-sm transition-colors hover:bg-brand-mint/90"
        >
            <Plus size={16} />
            {t('pages.contractDetails.cancellation.importFromCatalog', { defaultValue: 'Import from Catalog' })}
        </button>
    );

    if (isLoading) {
        return (
            <ContractSectionShell
                icon={ShieldAlert}
                title={t('pages.contractDetails.cancellation.title', { defaultValue: 'Cancellation Rules' })}
                description={t('pages.contractDetails.cancellation.description', {
                    defaultValue: 'Define cancellation penalties and release conditions for this contract.',
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
                icon={ShieldAlert}
                title={t('pages.contractDetails.cancellation.title', { defaultValue: 'Cancellation Rules' })}
                description={t('pages.contractDetails.cancellation.description', {
                    defaultValue: 'Define cancellation penalties and release conditions for this contract.',
                })}
                action={importAction}
            >
                <ContractSectionAlert>
                    {t('pages.contractDetails.cancellation.loadError', { defaultValue: 'Unable to load cancellation rules.' })}
                </ContractSectionAlert>
            </ContractSectionShell>
        );
    }

    const items = rules ?? [];

    return (
        <>
            <ContractSectionShell
                icon={ShieldAlert}
                title={t('pages.contractDetails.cancellation.title', { defaultValue: 'Cancellation Rules' })}
                description={t('pages.contractDetails.cancellation.description', {
                    defaultValue: 'Define cancellation penalties and release conditions for this contract.',
                })}
                count={items.length}
                action={importAction}
            >
                {items.length === 0 ? (
                    <ContractSectionEmpty
                        icon={ShieldAlert}
                        title={t('pages.contractDetails.cancellation.emptyTitle', { defaultValue: 'No cancellation rules in this contract' })}
                        description={t('pages.contractDetails.cancellation.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    />
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
            </ContractSectionShell>

            <EditContractCancellationModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingRule(null); }}
                contract={contract}
                editItem={editingRule}
            />

            <ImportContractCancellationModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                contractId={contract.id}
            />
        </>
    );
}
