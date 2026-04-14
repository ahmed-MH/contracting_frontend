import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTemplateSupplements } from '../hooks/useTemplateSupplements';
import { useImportSupplement } from '../../../contracts/hooks/useContractSupplements';
import { useContractSupplements } from '../../../contracts/hooks/useContractSupplements';
import { Package, CalendarDays, Search, X, Plus, AlertCircle } from 'lucide-react';
import type { SupplementCalculationType } from '../../../../types';
import type { ContractOutletContext } from '../../../contracts/details/components/ContractDetailsLayout';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../../components/ui/ModalPortal';

const TYPE_LABELS: Record<SupplementCalculationType, string> = {
    FIXED: 'Fixe',
    PERCENTAGE: '%',
    FORMULA: 'Formule',
    FREE: 'Gratuit',
};

const TYPE_COLORS: Record<SupplementCalculationType, string> = {
    FIXED: 'bg-brand-mint/10 text-brand-mint border-brand-mint/30',
    PERCENTAGE: 'bg-brand-slate/10 text-brand-slate border-brand-slate/30',
    FORMULA: 'bg-brand-mint/10 text-brand-mint border-brand-mint/30',
    FREE: 'bg-brand-mint/10 text-brand-mint border-brand-mint/30',
};

interface Props {
    contractId: number;
    isOpen: boolean;
    onClose: () => void;
}

function formatShortDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ImportSupplementModal({ contractId, isOpen, onClose }: Props) {
    const { t } = useTranslation('common');
    void t;
    const { contract } = useOutletContext<ContractOutletContext>();
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const { data: result, isLoading: isLoadingTemplates } = useTemplateSupplements(1, 100, search);
    const { data: contractSupplements, isLoading: isLoadingContract } = useContractSupplements(contractId);
    const importMutation = useImportSupplement(contractId);

    const allTemplates = result?.data ?? [];

    // Filter by contract dates
    const contractStart = contract?.startDate ? new Date(contract.startDate).getTime() : null;
    const contractEnd = contract?.endDate ? new Date(contract.endDate).getTime() : null;
    const dateFilteredTemplates = allTemplates.filter((template) => {
        if (!template.specificDate) return true;
        const tMs = new Date(template.specificDate).getTime();
        if (contractStart != null && tMs < contractStart) return false;
        if (contractEnd != null && tMs > contractEnd) return false;
        return true;
    });

    // Filter out already-imported
    const importedTemplateIds = new Set(
        (contractSupplements ?? []).map((s) => s.templateId).filter((id): id is number => id !== null)
    );
    const availableTemplates = dateFilteredTemplates.filter((template) => !importedTemplateIds.has(template.id));

    const isLoading = isLoadingTemplates || isLoadingContract;
    const hiddenByDate = allTemplates.length - dateFilteredTemplates.length;

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
            <div className="bg-brand-light dark:bg-brand-navy rounded-2xl shadow-md w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-transparent dark:border-brand-slate/20">

                {/* ─── Header ──────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-brand-slate/15 dark:border-brand-slate/20 flex items-center justify-between bg-brand-light dark:bg-brand-navy">
                    <div>
                        <h3 className="text-lg font-bold text-brand-navy dark:text-brand-light">{t('auto.features.catalog.supplements.components.importsupplementmodal.ae5d6e61', { defaultValue: "Catalogue des Suppléments" })}</h3>
                        <p className="text-xs text-brand-slate font-medium tracking-wide mt-0.5 uppercase">{t('auto.features.catalog.supplements.components.importsupplementmodal.646ab347', { defaultValue: "Sélectionnez les suppléments à importer dans le contrat" })}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-brand-slate/10 rounded-full transition-colors cursor-pointer text-brand-slate dark:hover:text-brand-light">
                        <X size={20} />
                    </button>
                </div>

                {/* ─── Search ───────────────────────────────────────────── */}
                <div className="p-4 bg-brand-light dark:bg-brand-slate/10 border-b border-brand-slate/15 dark:border-brand-slate/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('auto.features.catalog.supplements.components.importsupplementmodal.placeholder.c353cc07', { defaultValue: "Rechercher un supplément par nom..." })}
                            className="w-full pl-10 pr-4 py-2 bg-brand-light dark:bg-brand-navy border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint dark:text-brand-light outline-hidden transition-all"
                        />
                    </div>
                    {(hiddenByDate > 0 || importedTemplateIds.size > 0) && (
                        <div className="mt-2 flex flex-col gap-0.5">
                            {hiddenByDate > 0 && (
                                <p className="text-[10px] text-brand-slate dark:text-brand-light/75 font-bold flex items-center gap-1">
                                    <CalendarDays size={11} /> {hiddenByDate} supplément(s) d'évènement hors des dates du contrat sont masqués.
                                </p>
                            )}
                            {importedTemplateIds.size > 0 && (
                                <p className="text-[10px] text-brand-mint font-bold flex items-center gap-1">
                                    ✓ {importedTemplateIds.size} supplément(s) déjà importé(s) dans ce contrat sont masqués.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── List ─────────────────────────────────────────────── */}
                <div className="overflow-y-auto flex-1 p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 grayscale opacity-50">
                            <div className="w-8 h-8 border-2 border-brand-mint border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-brand-slate uppercase tracking-widest">{t('auto.features.catalog.supplements.components.importsupplementmodal.bce140aa', { defaultValue: "Chargement du catalogue..." })}</p>
                        </div>
                    ) : availableTemplates.length === 0 ? (
                        <div className="text-center py-16">
                            <AlertCircle className="mx-auto text-brand-slate/30 mb-4" size={48} />
                            <p className="text-brand-navy dark:text-brand-light font-bold tracking-tight">
                                {allTemplates.length > 0 ? 'Tous les suppléments ont déjà été importés' : 'Le catalogue est vide'}
                            </p>
                            <p className="text-xs text-brand-slate/60 mt-1 max-w-[260px] mx-auto">
                                {allTemplates.length > 0
                                    ? 'Tous les suppléments disponibles sont déjà présents dans ce contrat.'
                                    : 'Veuillez d\'abord configurer vos suppléments dans les paramètres de l\'hôtel.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {availableTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => toggle(template.id)}
                                    className={`p-4 bg-brand-light dark:bg-brand-slate/10 border rounded-2xl transition-all group flex items-center gap-4 cursor-pointer ${
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
                                        <Package size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xl border ${TYPE_COLORS[template.type]}`}>
                                                {TYPE_LABELS[template.type]}
                                            </span>
                                            {template.isMandatory && (
                                                <span className="text-[10px] font-bold bg-brand-slate/10 text-brand-slate border border-brand-slate/30 px-2 py-0.5 rounded-xl">{t('auto.features.catalog.supplements.components.importsupplementmodal.18e9554a', { defaultValue: "Obligatoire" })}</span>
                                            )}
                                        </div>
                                        <h4 className={`font-bold uppercase tracking-tight text-sm transition-colors ${
                                            selectedIds.has(template.id) ? 'text-brand-mint' : 'text-brand-navy dark:text-brand-light group-hover:text-brand-mint'
                                        }`}>
                                            {template.name}
                                        </h4>
                                        {template.specificDate && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <CalendarDays size={11} className="text-brand-mint" />
                                                <span className="text-[11px] text-brand-mint font-bold">Évènement · {formatShortDate(template.specificDate)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── Footer ───────────────────────────────────────────── */}
                <div className="p-6 bg-brand-light dark:bg-brand-slate/10 border-t border-brand-slate/15 dark:border-brand-slate/20 flex items-center justify-between gap-3">
                    <p className="text-[10px] text-brand-slate font-bold uppercase tracking-wider">
                        {selectedIds.size > 0 ? `${selectedIds.size} supplément(s) sélectionné(s)` : 'Aucune sélection'}
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
