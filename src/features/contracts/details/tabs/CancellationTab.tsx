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
                {t('pages.contractDetails.cancellation.loadError', { defaultValue: 'Unable to load cancellation rules.' })}
            </div>
        );
    }

    const items = rules ?? [];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ShieldAlert size={20} className="text-brand-mint" />
                    <h2 className="text-base font-semibold text-brand-navy">
                        {t('pages.contractDetails.cancellation.title', { defaultValue: 'Cancellation Rules' })}
                    </h2>
                    <span className="text-xs text-brand-slate">({items.length})</span>
                </div>
                <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-mint rounded-xl hover:bg-brand-mint transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    {t('pages.contractDetails.cancellation.importFromCatalog', { defaultValue: 'Import from Catalog' })}
                </button>
            </div>

            {items.length === 0 ? (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <ShieldAlert size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">
                        {t('pages.contractDetails.cancellation.emptyTitle', { defaultValue: 'No cancellation rules in this contract' })}
                    </p>
                    <p className="text-brand-slate text-xs mt-1">
                        {t('pages.contractDetails.cancellation.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    </p>
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
