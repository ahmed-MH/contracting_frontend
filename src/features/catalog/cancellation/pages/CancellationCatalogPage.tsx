import { useState, useEffect } from 'react';
import {
    useTemplateCancellations,
    useArchivedTemplateCancellations,
    useCreateTemplateCancellation,
    useUpdateTemplateCancellation,
    useDeleteTemplateCancellation,
    useRestoreTemplateCancellation,
    type TemplateCancellationRule,
    type CreateTemplateCancellationRulePayload,
} from '../hooks/useTemplateCancellations';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import {
    ShieldAlert,
    Plus,
    Pencil,
    Trash2,
    Search,
    Hash,
    Percent,
    Banknote,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Archive,
    ChevronDown
} from 'lucide-react';
import { CancellationPenaltyType } from '../types/cancellation.types';
import TemplateCancellationModal from '../components/TemplateCancellationModal';

const PENALTY_LABELS: Record<CancellationPenaltyType, string> = {
    [CancellationPenaltyType.NIGHTS]: 'Nuits',
    [CancellationPenaltyType.PERCENTAGE]: 'Pourcentage',
    [CancellationPenaltyType.FIXED_AMOUNT]: 'Montant fixe',
};

const PENALTY_COLORS: Record<CancellationPenaltyType, string> = {
    [CancellationPenaltyType.NIGHTS]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    [CancellationPenaltyType.PERCENTAGE]: 'bg-amber-50 text-amber-700 border-amber-100',
    [CancellationPenaltyType.FIXED_AMOUNT]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const getIcon = (type: CancellationPenaltyType) => {
    switch (type) {
        case CancellationPenaltyType.NIGHTS: return <Hash size={12} />;
        case CancellationPenaltyType.PERCENTAGE: return <Percent size={12} />;
        case CancellationPenaltyType.FIXED_AMOUNT: return <Banknote size={12} />;
    }
};

export default function CancellationCatalogPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateCancellationRule | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;

    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: paginatedResult, isLoading, isError } = useTemplateCancellations(page, limit, debouncedSearch);
    const rules = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedRules } = useArchivedTemplateCancellations({ enabled: isAdmin });

    const createMutation = useCreateTemplateCancellation();
    const updateMutation = useUpdateTemplateCancellation();
    const deleteMutation = useDeleteTemplateCancellation();
    const restoreMutation = useRestoreTemplateCancellation();

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (r: TemplateCancellationRule) => { setEditing(r); setIsModalOpen(true); };

    const handleDelete = async (r: TemplateCancellationRule) => {
        if (await confirm({
            title: `Archiver la règle "${r.name}" ?`,
            description: "La règle sera archivée et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(r.id);
        }
    };

    const handleRestore = async (r: TemplateCancellationRule) => {
        if (await confirm({
            title: `Restaurer la règle "${r.name}" ?`,
            description: "La règle sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(r.id);
        }
    };

    const onSubmit = (data: CreateTemplateCancellationRulePayload) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data }, { onSuccess: closeModal });
        } else {
            createMutation.mutate(data, { onSuccess: closeModal });
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <ShieldAlert className="text-indigo-600" size={28} />
                        Catalogue Annulations
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez les politiques d'annulation (templates)</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer border-none outline-none">
                    <Plus size={16} /> Nouvelle Règle
                </button>
            </div>

            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une politique..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm font-bold">
                    Impossible de charger le catalogue d'annulations.
                </div>
            )}

            {!isLoading && !isError && rules.length === 0 && (
                <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 p-12 text-center">
                    <ShieldAlert size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune règle d'annulation trouvée</p>
                </div>
            )}

            {rules.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold">
                                <th className="px-5 py-3 text-xs uppercase tracking-wide">Nom de la politique</th>
                                <th className="px-5 py-3 text-xs uppercase tracking-wide">Fenêtre</th>
                                <th className="px-5 py-3 text-xs uppercase tracking-wide">Min Stay</th>
                                <th className="px-5 py-3 text-xs uppercase tracking-wide">Pénalité</th>
                                <th className="px-5 py-3 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rules.map((r: TemplateCancellationRule) => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 leading-tight inline-flex items-center gap-2">
                                                {r.name}
                                                {r.appliesToNoShow && (
                                                    <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">No-Show</span>
                                                )}
                                            </span>
                                            <span className="text-sm text-gray-500 font-mono">{r.reference || 'CAN-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-black">
                                            ≤ {r.daysBeforeArrival} jours
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 font-bold">
                                        {r.minStayCondition ? `${r.minStayCondition} nuits` : <span className="text-gray-300 text-xs font-normal italic">Sans condition</span>}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border ${PENALTY_COLORS[r.penaltyType]}`}>
                                                {getIcon(r.penaltyType)}
                                                {PENALTY_LABELS[r.penaltyType]}
                                            </span>
                                            <span className="text-sm font-black text-gray-900 font-mono">
                                                {r.baseValue}{r.penaltyType === CancellationPenaltyType.NIGHTS ? 'n' : r.penaltyType === CancellationPenaltyType.PERCENTAGE ? '%' : '€'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(r)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border-none outline-none cursor-pointer">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(r)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border-none outline-none cursor-pointer">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ─── Pagination Standard ────────────────────────────────── */}
                    {meta && meta.lastPage > 0 && (
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs text-gray-400 font-medium tracking-tight">
                                Affichage de <span className="font-bold text-gray-700">{(page - 1) * limit + 1}</span> à <span className="font-bold text-gray-700">{Math.min(page * limit, meta.total)}</span> sur <span className="font-bold text-gray-700">{meta.total}</span>
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-indigo-100"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center px-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg h-9 min-w-[36px] justify-center shadow-xs">
                                    {page} / {meta.lastPage}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                                    disabled={page >= meta.lastPage}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-indigo-100"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer border-none bg-transparent outline-none">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Règles archivées {archivedRules ? `(${archivedRules.length})` : ''}
                    </button>

                    {showArchived && archivedRules && archivedRules.length > 0 && (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-gray-100">
                                    {archivedRules.map((r: TemplateCancellationRule) => (
                                        <tr key={r.id} className="hover:bg-gray-100 transition-colors">
                                            <td className="px-5 py-3 text-gray-500 font-bold">{r.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(r)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer border-none shadow-xs">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <TemplateCancellationModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editItem={editing}
                onSubmit={onSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
