import { useState } from 'react';
import { useArrangements, useArchivedArrangements, useCreateArrangement, useUpdateArrangement, useDeleteArrangement, useRestoreArrangement, type Arrangement, type CreateArrangementPayload } from '../hooks/useArrangements';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { UtensilsCrossed, Plus, Pencil, Trash2, RotateCcw, Archive, ChevronDown, ChevronRight, Search } from 'lucide-react';
import ArrangementModal from '../components/ArrangementModal';

export default function ArrangementsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Arrangement | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [search, setSearch] = useState('');
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    const closeModal = () => { setIsModalOpen(false); setEditing(null); };

    const { data: arrangements, isLoading, isError } = useArrangements();
    const { data: archivedArrangements } = useArchivedArrangements(isAdmin && showArchived);

    const displayedArrangements = arrangements?.filter(arr =>
        arr.name.toLowerCase().includes(search.toLowerCase()) ||
        arr.code.toLowerCase().includes(search.toLowerCase())
    );

    const displayedArchivedArrangements = archivedArrangements?.filter(arr =>
        arr.name.toLowerCase().includes(search.toLowerCase()) ||
        arr.code.toLowerCase().includes(search.toLowerCase())
    );
    const createMutation = useCreateArrangement(closeModal);
    const updateMutation = useUpdateArrangement(closeModal);
    const deleteMutation = useDeleteArrangement();
    const restoreMutation = useRestoreArrangement();

    const openCreate = () => { setEditing(null); setIsModalOpen(true); };
    const openEdit = (item: Arrangement) => { setEditing(item); setIsModalOpen(true); };
    
    const handleDelete = async (item: Arrangement) => {
        if (await confirm({
            title: `Archiver l'arrangement "${item.code} – ${item.name}" ?`,
            description: "L'arrangement sera archivé.",
            confirmLabel: "Archiver",
            variant: "danger"
        })) {
            deleteMutation.mutate(item.id);
        }
    };

    const handleRestore = async (item: Arrangement) => {
        if (await confirm({
            title: `Restaurer l'arrangement "${item.code} – ${item.name}" ?`,
            description: "L'arrangement sera de nouveau actif.",
            confirmLabel: "Restaurer",
            variant: "info"
        })) {
            restoreMutation.mutate(item.id);
        }
    };

    const onSubmit = (data: CreateArrangementPayload) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8">
                <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
                    Impossible de charger les arrangements.
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <UtensilsCrossed className="text-indigo-600" size={28} />
                        Arrangements
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Plans repas proposés par l'hôtel</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer border-none outline-none">
                    <Plus size={16} /> Nouvel Arrangement
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
                        placeholder="Rechercher un arrangement..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {(!isLoading && !isError && arrangements?.length === 0) ? (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <UtensilsCrossed size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucun arrangement défini</p>
                    <p className="text-gray-400 text-xs mt-1">Cliquez sur « Nouvel Arrangement » pour commencer</p>
                </div>
            ) : arrangements && arrangements.length > 0 && displayedArrangements?.length === 0 ? (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <UtensilsCrossed size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucun arrangement trouvé pour "{search}"</p>
                </div>
            ) : displayedArrangements && displayedArrangements.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Code</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Libellé</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Niveau</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Description</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedArrangements.map((arr) => (
                                <tr key={arr.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold font-mono tracking-wider border border-emerald-100 uppercase">
                                            {arr.code}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">{arr.name}</span>
                                            <span className="text-xs text-gray-400 mt-0.5 font-mono uppercase">{arr.reference || 'REF-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight border ${arr.level === 0 ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                            Niveau {arr.level}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-xs text-gray-500 italic max-w-[280px] truncate block" title={arr.description || ''}>
                                            {arr.description || <span className="text-gray-300">Aucune description</span>}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button onClick={() => openEdit(arr)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border-none outline-none bg-transparent" title="Modifier">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(arr)} disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none bg-transparent" title="Supprimer">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        {displayedArrangements.length} arrangement{displayedArrangements.length > 1 ? 's' : ''} {arrangements && arrangements.length > displayedArrangements.length && `(sur ${arrangements.length})`}
                    </div>
                </div>
            )}

            {/* ─── Archived Section (ADMIN only) ───────────────────────── */}
            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer border-none outline-none bg-transparent">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Arrangements archivés {archivedArrangements ? `(${archivedArrangements.length})` : ''}
                    </button>

                    {showArchived && displayedArchivedArrangements && displayedArchivedArrangements.length > 0 && (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-200">
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Code</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nom</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {displayedArchivedArrangements.map((arr) => (
                                        <tr key={arr.id} className="hover:bg-gray-100 transition-colors">
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-200 text-gray-600 text-xs font-bold font-mono tracking-wider">
                                                    {arr.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 italic">{arr.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(arr)} disabled={restoreMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer border-none outline-none">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showArchived && archivedArrangements && archivedArrangements.length === 0 && (
                        <p className="mt-3 text-sm text-gray-400 italic">Aucun arrangement archivé</p>
                    )}
                </div>
            )}

            <ArrangementModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                editing={editing} 
                onSubmit={onSubmit}
                isPending={isPending}
            />
        </div>
    );
}
