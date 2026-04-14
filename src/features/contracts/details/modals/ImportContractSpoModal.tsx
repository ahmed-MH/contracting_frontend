import { useState } from 'react';
import { useSpoTemplates } from '../../../catalog/spos/hooks/useSpoTemplates';
import { useImportContractSpo, useContractSpos } from '../../hooks/useContractSpos';
import { X, Tag, Search, Plus, AlertCircle } from 'lucide-react';
import type { TemplateSpo } from '../../../catalog/spos/types/spos.types';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../../components/ui/ModalPortal';

interface ImportContractSpoModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: number;
}

function formatCondition(spo: TemplateSpo): string {
    switch (spo.conditionType) {
        case 'MIN_NIGHTS': return `Min. ${spo.conditionValue} nuits`;
        case 'EARLY_BIRD': return `Réservé ${spo.conditionValue} j. avance`;
        case 'LONG_STAY': return `> ${spo.conditionValue} nuits`;
        case 'HONEYMOONER': return 'Voyage de noces';
        case 'NONE': return 'Aucune condition';
        default: return spo.conditionType;
    }
}

function formatBenefit(spo: TemplateSpo): string {
    const displayValue = (spo.value && Number(spo.value) !== 0) ? spo.value : spo.benefitValue;
    switch (spo.benefitType) {
        case 'PERCENTAGE_DISCOUNT': return `-${displayValue}%`;
        case 'FIXED_DISCOUNT': return `-${displayValue} TND`;
        case 'FREE_NIGHTS': return `${spo.stayNights}=${spo.payNights}`;
        case 'FREE_ROOM_UPGRADE': return 'Surclassement Chambre';
        case 'FREE_BOARD_UPGRADE': return 'Surclassement Pension';
        case 'KIDS_GO_FREE': return 'Enfants gratuits';
        default: return spo.benefitType;
    }
}

export default function ImportContractSpoModal({ isOpen, onClose, contractId }: ImportContractSpoModalProps) {
    const { t } = useTranslation('common');
    void t;
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const { data: pageData, isLoading: isLoadingTemplates, isError } = useSpoTemplates({ page: 1, limit: 50, search });
    const { data: contractSpos, isLoading: isLoadingContract } = useContractSpos(contractId);
    const importMutation = useImportContractSpo(contractId);

    // Already-imported: ContractSpo has templateSpoId
    const importedTemplateIds = new Set(
        (contractSpos ?? []).map((s) => s.templateSpoId ?? s.templateSpo?.id).filter((id): id is number => id !== undefined && id !== null)
    );
    const allTemplates = pageData?.data ?? [];
    const availableTemplates = allTemplates.filter((t: TemplateSpo) => !importedTemplateIds.has(t.id));
    const isLoading = isLoadingTemplates || isLoadingContract;

    const toggle = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleImport = async () => {
        for (const templateId of selectedIds) {
            await importMutation.mutateAsync(templateId);
        }
        setSelectedIds(new Set());
        onClose();
    };

    const handleClose = () => {
        setSelectedIds(new Set());
        setSearch('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <ModalPortal isOpen={isOpen} onClose={handleClose}>
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-brand-navy/55 backdrop-blur-sm">
            <div className="bg-brand-light dark:bg-brand-navy border border-transparent dark:border-brand-slate/20 rounded-2xl shadow-md w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">

                <div className="px-6 py-4 border-b border-brand-slate/15 dark:border-brand-slate/20 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-brand-navy dark:text-brand-light">{t('auto.features.contracts.details.modals.importcontractspomodal.1c3b6450', { defaultValue: "Catalogue des Offres Spéciales" })}</h3>
                        <p className="text-xs text-brand-slate font-medium tracking-wide mt-0.5 uppercase">{t('auto.features.contracts.details.modals.importcontractspomodal.8a133cbb', { defaultValue: "Sélectionnez les SPO à importer dans le contrat" })}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full transition-colors cursor-pointer text-brand-slate hover:text-brand-navy hover:bg-brand-slate/10 dark:hover:text-brand-light dark:hover:bg-brand-slate/20">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-brand-light/50 dark:bg-brand-navy/50 border-b border-brand-slate/15 dark:border-brand-slate/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" size={16} />
                        <input
                            type="text"
                            placeholder={t('auto.features.contracts.details.modals.importcontractspomodal.placeholder.4a2b02cd', { defaultValue: "Rechercher une offre par nom..." })}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-brand-light dark:bg-brand-navy/80 border border-brand-slate/20 rounded-xl text-sm text-brand-navy dark:text-brand-light focus:ring-2 focus:ring-brand-mint outline-hidden transition-all"
                        />
                    </div>
                    {importedTemplateIds.size > 0 && (
                        <p className="text-[10px] text-brand-mint font-bold mt-2 flex items-center gap-1">
                            ✓ {importedTemplateIds.size} offre(s) déjà importée(s) dans ce contrat sont masquées.
                        </p>
                    )}
                </div>

                {/* ─── List ─────────────────────────────────────────────── */}
                <div className="overflow-y-auto flex-1 p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 grayscale opacity-50">
                            <div className="w-8 h-8 border-2 border-brand-mint border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-brand-slate uppercase tracking-widest">{t('auto.features.contracts.details.modals.importcontractspomodal.ce0c87d4', { defaultValue: "Chargement du catalogue..." })}</p>
                        </div>
                    ) : isError || availableTemplates.length === 0 ? (
                        <div className="text-center py-16">
                            <AlertCircle className="mx-auto text-brand-slate/30 mb-4" size={48} />
                            <p className="text-brand-navy dark:text-brand-light font-bold tracking-tight">
                                {isError ? 'Erreur de chargement' : allTemplates.length > 0 ? 'Toutes les offres ont déjà été importées' : 'Le catalogue est vide'}
                            </p>
                            <p className="text-xs text-brand-slate/60 mt-1 max-w-[260px] mx-auto">
                                {isError
                                    ? 'Impossible de charger le catalogue.'
                                    : allTemplates.length > 0
                                    ? 'Toutes les offres disponibles sont déjà présentes dans ce contrat.'
                                    : 'Veuillez d\'abord configurer vos offres dans les paramètres de l\'hôtel.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {availableTemplates.map((template: TemplateSpo) => (
                                <div
                                    key={template.id}
                                    onClick={() => toggle(template.id)}
                                    className={`p-4 bg-brand-light dark:bg-brand-navy/40 border rounded-2xl transition-all group flex items-center gap-4 cursor-pointer ${
                                        selectedIds.has(template.id)
                                            ? 'border-brand-mint shadow-md ring-2 ring-brand-mint/20'
                                            : 'border-brand-slate/20 hover:border-brand-mint hover:shadow-md'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(template.id)}
                                        onChange={() => toggle(template.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-brand-mint border-brand-slate/30 rounded-xl focus:ring-brand-mint cursor-pointer shrink-0"
                                    />
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ring-1 transition-colors shrink-0 ${
                                        selectedIds.has(template.id)
                                            ? 'bg-brand-mint text-brand-light ring-brand-mint/30'
                                            : 'bg-brand-mint/10 text-brand-mint ring-brand-mint/20 group-hover:bg-brand-mint group-hover:text-brand-light'
                                    }`}>
                                        <Tag size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold uppercase tracking-tight text-sm transition-colors ${
                                            selectedIds.has(template.id) ? 'text-brand-mint' : 'text-brand-navy dark:text-brand-light group-hover:text-brand-mint'
                                        }`}>
                                            {template.name}
                                        </h4>
                                        <p className="text-xs text-brand-slate mt-1 flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-brand-slate bg-brand-slate/10 px-1.5 py-0.5 rounded border border-brand-slate/30">
                                                SI: {formatCondition(template)}
                                            </span>
                                            <span>•</span>
                                            <span className="font-bold text-brand-mint bg-brand-mint/10 px-1.5 py-0.5 rounded border border-brand-mint/20">
                                                ALORS: {formatBenefit(template)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-brand-light/50 dark:bg-brand-navy/50 border-t border-brand-slate/15 dark:border-brand-slate/20 flex items-center justify-between gap-3">
                    <p className="text-[10px] text-brand-slate font-bold uppercase tracking-wider">
                        {selectedIds.size > 0 ? `${selectedIds.size} offre(s) sélectionnée(s)` : 'Aucune sélection'}
                    </p>
                    <div className="flex gap-3">
                        <button type="button" onClick={handleClose} className="px-6 py-2.5 text-sm font-bold text-brand-slate hover:text-brand-navy dark:hover:text-brand-light transition-colors cursor-pointer">
                            Annuler
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedIds.size === 0 || importMutation.isPending}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-brand-mint text-brand-light text-sm font-bold rounded-xl hover:bg-brand-mint/90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
                        >
                            {importMutation.isPending
                                ? <div className="w-4 h-4 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                                : <Plus size={16} />}
                            Importer {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                        </button>
                    </div>
                </div>

            </div>
        </div>
        </ModalPortal>
    );
}
