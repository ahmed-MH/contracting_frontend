import { useState } from 'react';
import { useRoomTypes, useArchivedRoomTypes, useCreateRoomType, useUpdateRoomType, useDeleteRoomType, useRestoreRoomType, type RoomType, type CreateRoomTypePayload } from '../hooks/useRoomTypes';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { BedDouble, Plus, Pencil, Trash2, RotateCcw, Archive, ChevronDown, ChevronRight, Search } from 'lucide-react';
import RoomTypeModal from '../components/RoomTypeModal';

export default function RoomTypesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [search, setSearch] = useState('');
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'ADMIN';

    const { data: roomTypes, isLoading, isError } = useRoomTypes();
    const { data: archivedRoomTypes } = useArchivedRoomTypes(isAdmin && showArchived);

    const displayedRoomTypes = roomTypes?.filter(rt =>
        rt.name.toLowerCase().includes(search.toLowerCase()) ||
        rt.code.toLowerCase().includes(search.toLowerCase())
    );

    const displayedArchivedTypes = archivedRoomTypes?.filter(rt =>
        rt.name.toLowerCase().includes(search.toLowerCase()) ||
        rt.code.toLowerCase().includes(search.toLowerCase())
    );

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRoom(null);
    };

    const createMutation = useCreateRoomType(closeModal);
    const updateMutation = useUpdateRoomType(closeModal);
    const deleteMutation = useDeleteRoomType();
    const restoreMutation = useRestoreRoomType();

    const openCreate = () => {
        setEditingRoom(null);
        setIsModalOpen(true);
    };

    const openEdit = (room: RoomType) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleDelete = async (room: RoomType) => {
        if (await confirm({
            title: `Archiver la chambre "${room.code} – ${room.name}" ?`,
            description: "La chambre sera archivée et pourra être restaurée plus tard.",
            confirmLabel: "Archiver",
            variant: "danger"
        })) {
            deleteMutation.mutate(room.id);
        }
    };

    const handleRestore = async (room: RoomType) => {
        if (await confirm({
            title: `Restaurer la chambre "${room.code} – ${room.name}" ?`,
            description: "La chambre sera de nouveau active.",
            confirmLabel: "Restaurer",
            variant: "info"
        })) {
            restoreMutation.mutate(room.id);
        }
    };

    const onSubmit = (payload: CreateRoomTypePayload) => {
        if (editingRoom) {
            updateMutation.mutate({ id: editingRoom.id, data: payload });
        } else {
            createMutation.mutate(payload);
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
                    Impossible de charger les types de chambres.
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <BedDouble className="text-indigo-600" size={28} />
                        Types de Chambres
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Définissez les chambres vendables de l'hôtel
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer border-none outline-none"
                >
                    <Plus size={16} />
                    Nouvelle Chambre
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
                        placeholder="Rechercher une chambre..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            {(!isLoading && !isError && roomTypes?.length === 0) ? (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <BedDouble size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune chambre définie pour le moment</p>
                    <p className="text-gray-400 text-xs mt-1">Cliquez sur « Nouvelle Chambre » pour commencer</p>
                </div>
            ) : roomTypes && roomTypes.length > 0 && displayedRoomTypes?.length === 0 ? (
                <div className="rounded-xl bg-gray-100 border border-dashed border-gray-300 p-12 text-center">
                    <BedDouble size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Aucune chambre trouvée pour "{search}"</p>
                </div>
            ) : displayedRoomTypes && displayedRoomTypes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Code</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Libellé</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Occupancy</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Adultes</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Enfants</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-center">Lit bébé</th>
                                <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedRoomTypes.map((rt) => (
                                <tr key={rt.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold font-mono tracking-wider border border-indigo-100">
                                            {rt.code}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">{rt.name}</span>
                                            <span className="text-xs text-gray-400 mt-0.5 font-mono uppercase">{rt.reference || 'REF-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                            {rt.minOccupancy}–{rt.maxOccupancy}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center text-gray-600 text-xs font-medium">
                                        {rt.minAdults}–{rt.maxAdults}
                                    </td>
                                    <td className="px-5 py-3 text-center text-gray-600 text-xs font-medium">
                                        {rt.minChildren}–{rt.maxChildren}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        {rt.allowCotOverMax ? (
                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase">Autorisé</span>
                                        ) : (
                                            <span className="text-[10px] bg-gray-50 text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full font-bold uppercase">Non</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                onClick={() => openEdit(rt)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border-none outline-none bg-transparent"
                                                title="Modifier"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rt)}
                                                disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none bg-transparent"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        Total {displayedRoomTypes.length} type{displayedRoomTypes.length > 1 ? 's' : ''} de chambre{displayedRoomTypes.length > 1 ? 's' : ''} affiché{displayedRoomTypes.length > 1 ? 's' : ''}
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
                        Chambres archivées {archivedRoomTypes ? `(${archivedRoomTypes.length})` : ''}
                    </button>

                    {showArchived && displayedArchivedTypes && displayedArchivedTypes.length > 0 && (
                        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-200">
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Code</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Libellé</th>
                                        <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {displayedArchivedTypes.map((rt) => (
                                        <tr key={rt.id} className="hover:bg-gray-100 transition-colors cursor-default">
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-200 text-gray-600 text-xs font-bold font-mono tracking-wider border border-gray-300">
                                                    {rt.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 italic font-medium">{rt.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(rt)} disabled={restoreMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none">
                                                    <RotateCcw size={14} /> Restaurer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {showArchived && archivedRoomTypes && archivedRoomTypes.length === 0 && (
                        <p className="mt-3 text-sm text-gray-400 italic">Aucune chambre archivée</p>
                    )}
                </div>
            )}

            {/* ─── Modal (Create / Edit) ──────────────────────────────── */}
            <RoomTypeModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editing={editingRoom}
                onSubmit={onSubmit}
                isPending={isPending}
            />
        </div>
    );
}
