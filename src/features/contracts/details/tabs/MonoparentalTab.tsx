import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('common');

    const handleDelete = async (rule: ContractMonoparentalRule) => {
        if (await confirm({
            title: t('pages.contractDetails.monoparental.deleteTitle', {
                defaultValue: 'Delete rule \"{{name}}\"?',
                name: rule.name,
            }),
            description: t('pages.contractDetails.monoparental.deleteDescription', {
                defaultValue: 'This rule will be permanently removed from this contract.',
            }),
            confirmLabel: t('pages.contractDetails.monoparental.deleteConfirm', { defaultValue: 'Delete' }),
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

    const items = rules ?? [];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Contact size={20} className="text-brand-mint" />
                    <h2 className="text-base font-semibold text-brand-navy">
                        {t('pages.contractDetails.monoparental.title', { defaultValue: 'Monoparental Rules' })}
                    </h2>
                    <span className="text-xs text-brand-slate">({items.length})</span>
                </div>
                <button
                    onClick={() => setShowImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-mint rounded-xl hover:bg-brand-mint transition-colors cursor-pointer"
                >
                    <Plus size={16} />
                    {t('pages.contractDetails.monoparental.importFromCatalog', { defaultValue: 'Import from Catalog' })}
                </button>
            </div>

            {items.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <Contact size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">
                        {t('pages.contractDetails.monoparental.emptyTitle', { defaultValue: 'No monoparental rule' })}
                    </p>
                    <p className="text-brand-slate text-xs mt-1">
                        {t('pages.contractDetails.monoparental.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    </p>
                </div>
            )}

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

            <ImportMonoparentalRuleModal
                contractId={contract.id}
                isOpen={showImport}
                onClose={() => setShowImport(false)}
            />

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
