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
import { ContractSectionEmpty, ContractSectionLoading, ContractSectionShell } from '../components/ContractSection';

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

    const importAction = (
        <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-mint px-4 py-2 text-sm font-medium text-brand-light shadow-sm transition-colors hover:bg-brand-mint/90"
        >
            <Plus size={16} />
            {t('pages.contractDetails.monoparental.importFromCatalog', { defaultValue: 'Import from Catalog' })}
        </button>
    );

    if (isLoading) {
        return (
            <ContractSectionShell
                icon={Contact}
                title={t('pages.contractDetails.monoparental.title', { defaultValue: 'Monoparental Rules' })}
                description={t('pages.contractDetails.monoparental.description', {
                    defaultValue: 'Configure single-parent commercial conditions and period applicability.',
                })}
                action={importAction}
            >
                <ContractSectionLoading label={t('states.loading', { defaultValue: 'Loading...' })} />
            </ContractSectionShell>
        );
    }

    const items = rules ?? [];

    return (
        <>
            <ContractSectionShell
                icon={Contact}
                title={t('pages.contractDetails.monoparental.title', { defaultValue: 'Monoparental Rules' })}
                description={t('pages.contractDetails.monoparental.description', {
                    defaultValue: 'Configure single-parent commercial conditions and period applicability.',
                })}
                count={items.length}
                action={importAction}
            >
                {items.length === 0 ? (
                    <ContractSectionEmpty
                        icon={Contact}
                        title={t('pages.contractDetails.monoparental.emptyTitle', { defaultValue: 'No monoparental rule' })}
                        description={t('pages.contractDetails.monoparental.emptySubtitle', { defaultValue: 'Import from the catalog to get started' })}
                    />
                ) : (
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
            </ContractSectionShell>

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
