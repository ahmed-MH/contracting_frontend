import { useState } from 'react';
import { useTemplateReductions } from '../hooks/useTemplateReductions';
import { useImportReduction, useContractReductions } from '../../../contracts/hooks/useContractReductions';
import { Baby, Search, X, Plus, AlertCircle } from 'lucide-react';
import type { PaxType } from '../../../../types';

const PAX_LABELS: Record<PaxType, string> = {
    FIRST_CHILD: '1er Enfant',
    SECOND_CHILD: '2ème Enfant',
    THIRD_CHILD: '3ème Enfant',
    THIRD_ADULT: '3ème Adulte',
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    contractId: number;
}

export default function ImportReductionModal({ isOpen, onClose, contractId }: Props) {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Templates from catalog
    const { data: result, isLoading: isLoadingTemplates } = useTemplateReductions(1, 100, search);
    const templates = result?.data ?? [];

    // Already-imported reductions in this contract
    const { data: contractReductions, isLoading: isLoadingContract } = useContractReductions(contractId);
    const importedTemplateIds = new Set(
        (contractReductions ?? []).map((r) => r.templateId).filter((id): id is number => id !== null)
    );

    // Filter out already-imported templates
    const availableTemplates = templates.filter((t) => !importedTemplateIds.has(t.id));
    const isLoading = isLoadingTemplates || isLoadingContract;

    const importMutation = useImportReduction(contractId);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* ─── Header ──────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Catalogue des Réductions</h3>
                        <p className="text-xs text-gray-400 font-medium tracking-wide mt-0.5 uppercase">Sélectionnez les réductions à importer dans le contrat</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* ─── Search ───────────────────────────────────────────── */}
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher une réduction par nom..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all"
                        />
                    </div>
                    {importedTemplateIds.size > 0 && (
                        <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                            ℹ️ {importedTemplateIds.size} réduction(s) déjà importée(s) dans ce contrat sont masquées.
                        </p>
                    )}
                </div>

                {/* ─── List ─────────────────────────────────────────────── */}
                <div className="overflow-y-auto flex-1 p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 grayscale opacity-50">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chargement du catalogue...</p>
                        </div>
                    ) : availableTemplates.length === 0 ? (
                        <div className="text-center py-16">
                            <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500 font-bold tracking-tight">
                                {templates.length > 0 ? 'Toutes les réductions ont déjà été importées' : 'Le catalogue est vide'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 max-w-[260px] mx-auto">
                                {templates.length > 0
                                    ? 'Toutes les réductions disponibles sont déjà présentes dans ce contrat.'
                                    : 'Veuillez d\'abord configurer vos réductions dans les paramètres de l\'hôtel.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {availableTemplates.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => toggle(t.id)}
                                    className={`p-4 bg-white border rounded-2xl transition-all group flex items-center gap-4 cursor-pointer ${
                                        selectedIds.has(t.id)
                                            ? 'border-indigo-400 shadow-lg ring-2 ring-indigo-100'
                                            : 'border-gray-200 hover:border-indigo-400 hover:shadow-lg'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(t.id)}
                                        onChange={() => toggle(t.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded-sm focus:ring-indigo-500 cursor-pointer shrink-0"
                                    />
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ring-1 transition-colors shrink-0 ${
                                        selectedIds.has(t.id)
                                            ? 'bg-indigo-600 text-white ring-indigo-200'
                                            : 'bg-indigo-50 text-indigo-600 ring-indigo-100 group-hover:bg-indigo-600 group-hover:text-white'
                                    }`}>
                                        <Baby size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold uppercase tracking-tight text-sm transition-colors ${
                                            selectedIds.has(t.id) ? 'text-indigo-600' : 'text-gray-900 group-hover:text-indigo-600'
                                        }`}>
                                            {t.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">{PAX_LABELS[t.paxType]}</span>
                                            <span>•</span>
                                            <span className="font-mono">{t.minAge}–{t.maxAge} ans</span>
                                            <span>•</span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                {t.calculationType === 'FREE' ? 'Gratuit' : t.calculationType === 'PERCENTAGE' ? `${t.value}%` : `${t.value} TND`}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── Footer ───────────────────────────────────────────── */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {selectedIds.size > 0 ? `${selectedIds.size} réduction(s) sélectionnée(s)` : 'Aucune sélection'}
                    </p>
                    <div className="flex gap-3">
                        <button type="button" onClick={handleClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
                            Annuler
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedIds.size === 0 || importMutation.isPending}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale cursor-pointer"
                        >
                            {importMutation.isPending
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Plus size={16} />}
                            Importer {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
