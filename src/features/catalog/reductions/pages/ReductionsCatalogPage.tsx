import { useState, useEffect } from 'react';
import {
    useTemplateReductions,
    useArchivedTemplateReductions,
    useCreateTemplateReduction,
    useUpdateTemplateReduction,
    useDeleteTemplateReduction,
    useRestoreTemplateReduction,
    type TemplateReduction,
    type CreateTemplateReductionPayload,
} from '../hooks/useTemplateReductions';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import {
    Percent,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    Archive,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Search,
    Users,
} from 'lucide-react';
import TemplateReductionModal from '../components/TemplateReductionModal';

const PAX_TYPE_LABELS: Record<string, string> = {
    FIRST_CHILD: '1er Enfant',
    SECOND_CHILD: '2ème Enfant',
    THIRD_CHILD: '3ème Enfant',
    THIRD_ADULT: '3ème Adulte',
};

const CALC_TYPE_COLORS: Record<string, string> = {
    PERCENTAGE: 'bg-amber-50 text-amber-700 border-amber-100',
    FIXED: 'bg-blue-50 text-blue-700 border-blue-100',
    FREE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export default function ReductionsCatalogPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateReduction | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: paginatedResult, isLoading, isError } = useTemplateReductions(page, limit, debouncedSearch);
    const reductions = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedReductions } = useArchivedTemplateReductions({ enabled: isAdmin });
    
    const createMutation = useCreateTemplateReduction();
    const updateMutation = useUpdateTemplateReduction();
    const deleteMutation = useDeleteTemplateReduction();
    const restoreMutation = useRestoreTemplateReduction();

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (r: TemplateReduction) => { setEditing(r); setIsModalOpen(true); };

    const handleDelete = async (r: TemplateReduction) => {
        if (await confirm({
            title: `Archiver la réduction "${r.name}" ?`,
            description: "La réduction sera archivée et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(r.id);
        }
    };

    const handleRestore = async (r: TemplateReduction) => {
        if (await confirm({
            title: `Restaurer la réduction "${r.name}" ?`,
            description: "La réduction sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(r.id);
        }
    };

    const onSubmit = (data: CreateTemplateReductionPayload) => {
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
                        <Percent className="text-indigo-600" size={28} />
                        Catalogue Réductions
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Définitions des réductions réutilisables (templates)</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer border-none outline-none">
                    <Plus size={16} /> Nouvelle Réduction
                </button>
            </div>

            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une réduction..."
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
                    Impossible de charger les réductions.
                </div>
            )}

            {!isLoading && !isError && reductions.length === 0 && (
                <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 p-12 text-center">
                    <Percent size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune réduction trouvée</p>
                </div>
            )}

            {reductions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nom</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Cible</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Âges</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Valeur</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reductions.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 leading-tight">{r.name}</span>
                                            <span className="text-sm text-gray-500 font-mono">{r.reference || 'RED-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 shrink-0">
                                        <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 w-fit">
                                            <Users size={12} />
                                            {PAX_TYPE_LABELS[r.paxType]}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-gray-500 text-xs font-bold font-mono">
                                        {r.minAge} — {r.maxAge} ans
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${CALC_TYPE_COLORS[r.calculationType]}`}>
                                            {r.calculationType === 'FREE' ? 'Gratuit' : r.calculationType === 'PERCENTAGE' ? `-${r.value}%` : `-${r.value} €`}
                                        </span>
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
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer border-none bg-transparent outline-none font-bold">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Réductions archivées {archivedReductions ? `(${archivedReductions.length})` : ''}
                    </button>

                    {showArchived && archivedReductions && archivedReductions.length > 0 && (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-gray-100">
                                    {archivedReductions.map((r: any) => (
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
                    {showArchived && archivedReductions && archivedReductions.length === 0 && (
                        <p className="mt-3 text-sm text-gray-400 italic font-medium ml-6">Aucune réduction archivée</p>
                    )}
                </div>
            )}

            <TemplateReductionModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editItem={editing}
                onSubmit={onSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
