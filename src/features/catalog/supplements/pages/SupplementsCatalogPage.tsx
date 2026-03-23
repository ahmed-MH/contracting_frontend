import { useState, useEffect } from 'react';
import {
    useTemplateSupplements,
    useArchivedTemplateSupplements,
    useCreateTemplateSupplement,
    useUpdateTemplateSupplement,
    useDeleteTemplateSupplement,
    useRestoreTemplateSupplement,
    type TemplateSupplement,
    type CreateTemplateSupplementPayload,
} from '../hooks/useTemplateSupplements';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import {
    Package,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    Archive,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Search,
    CalendarDays,
} from 'lucide-react';
import type { SupplementCalculationType, PricingModifierApplicationType } from '../../../../types';
import TemplateSupplementModal from '../components/TemplateSupplementModal';

const TYPE_LABELS: Record<SupplementCalculationType, string> = {
    FIXED: 'Fixe',
    PERCENTAGE: 'Pourcentage',
    FORMULA: 'Formule',
    FREE: 'Gratuit',
};

const APPLICATION_LABELS: Record<PricingModifierApplicationType, string> = {
    PER_NIGHT_PER_PERSON: 'Par pers./nuit',
    PER_NIGHT_PER_ROOM: 'Par chambre',
    FLAT_RATE_PER_STAY: 'Forfait séjour',
};

const TYPE_COLORS: Record<SupplementCalculationType, string> = {
    FIXED: 'bg-blue-50 text-blue-700',
    PERCENTAGE: 'bg-amber-50 text-amber-700',
    FORMULA: 'bg-purple-50 text-purple-700',
    FREE: 'bg-emerald-50 text-emerald-700',
};

function formatShortDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SupplementsCatalogPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateSupplement | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const limit = 10;
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    // Debounce search input (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const { data: paginatedResult, isLoading, isError } = useTemplateSupplements(page, limit, debouncedSearch);
    const supplements = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedSupplements } = useArchivedTemplateSupplements({ enabled: isAdmin });
    const createMutation = useCreateTemplateSupplement();
    const updateMutation = useUpdateTemplateSupplement();
    const deleteMutation = useDeleteTemplateSupplement();
    const restoreMutation = useRestoreTemplateSupplement();

    const openCreate = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (s: TemplateSupplement) => {
        setEditing(s);
        setIsModalOpen(true);
    };

    const handleDelete = async (s: TemplateSupplement) => {
        if (await confirm({
            title: `Archiver le supplément "${s.name}" ?`,
            description: "Le supplément sera archivé et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(s.id);
        }
    };

    const handleRestore = async (s: TemplateSupplement) => {
        if (await confirm({
            title: `Restaurer le supplément "${s.name}" ?`,
            description: "Le supplément sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(s.id);
        }
    };

    const onSubmit = (data: CreateTemplateSupplementPayload) => {
        const payload = { ...data };
        if (payload.type === 'FREE') {
            payload.value = undefined;
            payload.formula = undefined;
        } else if (payload.type !== 'FORMULA') {
            payload.formula = undefined;
        }

        if (!payload.specificDate) {
            payload.specificDate = null;
        }

        if (editing) {
            updateMutation.mutate({ id: editing.id, data: payload }, { onSuccess: closeModal });
        } else {
            createMutation.mutate(payload, { onSuccess: closeModal });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const formatValue = (s: TemplateSupplement): string => {
        switch (s.type) {
            case 'FIXED':
                return `${s.value ?? 0}`;
            case 'PERCENTAGE':
                return `${s.value ?? 0}%`;
            case 'FORMULA':
                return s.formula ?? '—';
            case 'FREE':
                return 'Gratuit';
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Package className="text-indigo-600" size={28} />
                        Catalogue Suppléments
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Définitions des suppléments réutilisables (templates)</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer border-none outline-none">
                    <Plus size={16} /> Nouveau Supplément
                </button>
            </div>

            {/* ─── Search Bar ──────────────────────────────────────────── */}
            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un supplément..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
                    Impossible de charger les suppléments.
                </div>
            )}

            {!isLoading && !isError && supplements.length === 0 && (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <Package size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">
                        {debouncedSearch ? 'Aucun supplément trouvé' : 'Aucun supplément défini'}
                    </p>
                    {!debouncedSearch && (
                        <p className="text-gray-400 text-xs mt-1">Cliquez sur « Nouveau Supplément » pour commencer</p>
                    )}
                </div>
            )}

            {supplements.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nom</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Type</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Valeur</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Application</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Obligatoire</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {supplements.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{s.name}</span>
                                            <span className="text-sm text-gray-500 font-mono">{s.reference || 'SUP-PENDING'}</span>
                                            {s.specificDate && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <CalendarDays size={11} className="text-purple-500 shrink-0" />
                                                    <span className="text-[10px] text-purple-600 font-bold italic uppercase">
                                                        Évènement · {formatShortDate(s.specificDate)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide ${TYPE_COLORS[s.type]}`}>
                                            {TYPE_LABELS[s.type]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-700 font-mono text-xs">{formatValue(s)}</td>
                                    <td className="px-5 py-3 text-gray-500 text-xs">{APPLICATION_LABELS[s.applicationType]}</td>
                                    <td className="px-5 py-3 text-center">
                                        {s.isMandatory ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-semibold">
                                                Oui
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Non</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button onClick={() => openEdit(s)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border-none outline-none" title="Modifier">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(s)} disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none" title="Archiver">
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

            {/* ─── Archived Section (ADMIN only) ───────────────────────── */}
            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer border-none bg-transparent outline-none">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Suppléments archivés {archivedSupplements ? `(${archivedSupplements.length})` : ''}
                    </button>

                    {showArchived && archivedSupplements && archivedSupplements.length > 0 && (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-200">
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nom</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Type</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {archivedSupplements.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-100 transition-colors">
                                            <td className="px-5 py-3 text-gray-500 font-medium">{s.name}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide ${TYPE_COLORS[s.type]}`}>
                                                    {TYPE_LABELS[s.type]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(s)} disabled={restoreMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50 border-none">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showArchived && archivedSupplements && archivedSupplements.length === 0 && (
                        <p className="mt-3 text-sm text-gray-400 italic font-medium ml-6">Aucun supplément archivé</p>
                    )}
                </div>
            )}

            <TemplateSupplementModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editItem={editing}
                onSubmit={onSubmit}
                isPending={isPending}
            />
        </div>
    );
}

