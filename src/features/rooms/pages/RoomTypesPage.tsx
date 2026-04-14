import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoomTypes, useArchivedRoomTypes, useCreateRoomType, useUpdateRoomType, useDeleteRoomType, useRestoreRoomType, type RoomType, type CreateRoomTypePayload } from '../hooks/useRoomTypes';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { BedDouble, Plus, Pencil, Trash2, RotateCcw, Archive, ChevronDown, ChevronRight, Search } from 'lucide-react';
import EditRoomTypeModal from '../components/EditRoomTypeModal';
import { GuidedPageHeader } from '../../../components/layout/Workspace';

export default function RoomTypesPage() {
    const { t } = useTranslation('common');
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
            <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
                <div className="premium-surface border-brand-slate/20 p-6 text-sm text-brand-navy dark:text-brand-light">
                    Impossible de charger les types de chambres.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
            {/* Header */}
            <GuidedPageHeader
                icon={BedDouble}
                kicker={t('pages.rooms.header.kicker', { defaultValue: 'Hotel Setup' })}
                title={t('pages.rooms.header.title', { defaultValue: 'Types de Chambres' })}
                description={t('pages.rooms.header.subtitle', { defaultValue: "Define the hotel's sellable room inventory." })}
                actions={(
                <>
                <div className="hidden">
                    <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        <BedDouble className="text-brand-mint" size={28} />
                        Types de Chambres
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                        Définissez les chambres vendables de l'hôtel
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint cursor-pointer border-none outline-none"
                >
                    <Plus size={16} />
                    Nouvelle Chambre
                </button>
                </>
                )}
            />

            {/* ─── Search Bar ──────────────────────────────────────────── */}
            <section className="premium-surface p-4">
                <div className="relative w-full max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate/70" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('auto.features.rooms.pages.roomtypespage.placeholder.4f8e2e50', { defaultValue: "Rechercher une chambre..." })}
                        className="w-full rounded-xl border border-brand-slate/20 bg-brand-light/70 py-2.5 pl-9 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint/40 focus:ring-2 focus:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    />
                </div>
            </section>

            {/* Table */}
            {(!isLoading && !isError && roomTypes?.length === 0) ? (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <BedDouble size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.rooms.pages.roomtypespage.6d41bf0a', { defaultValue: "Aucune chambre définie pour le moment" })}</p>
                    <p className="text-brand-slate/70 text-xs mt-1">{t('auto.features.rooms.pages.roomtypespage.eea025ef', { defaultValue: "Cliquez sur « Nouvelle Chambre » pour commencer" })}</p>
                </div>
            ) : roomTypes && roomTypes.length > 0 && displayedRoomTypes?.length === 0 ? (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <BedDouble size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">Aucune chambre trouvée pour "{search}"</p>
                </div>
            ) : displayedRoomTypes && displayedRoomTypes.length > 0 && (
                <div className="premium-surface overflow-x-auto animate-in slide-in-from-bottom-2 duration-300">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light/80 border-b border-brand-slate/15">
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.rooms.pages.roomtypespage.60a25d6c', { defaultValue: "Code" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.rooms.pages.roomtypespage.f530c0be', { defaultValue: "Libellé" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.rooms.pages.roomtypespage.b23ebeb0', { defaultValue: "Occupancy" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.rooms.pages.roomtypespage.3033d562', { defaultValue: "Adultes" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.rooms.pages.roomtypespage.8ebed994', { defaultValue: "Enfants" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.rooms.pages.roomtypespage.b3557035', { defaultValue: "Lit bébé" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">
                                    {t('pages.roomTypes.table.actions', { defaultValue: 'Actions' })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {displayedRoomTypes.map((rt) => (
                                <tr key={rt.id} className="hover:bg-brand-light/80 transition-colors group">
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-brand-mint/10 text-brand-mint text-xs font-bold font-mono tracking-wider border border-brand-mint/20">
                                            {rt.code}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-brand-navy group-hover:text-brand-mint transition-colors leading-tight">{rt.name}</span>
                                            <span className="text-xs text-brand-slate/70 mt-0.5 font-mono uppercase">{rt.reference || 'REF-PENDING'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className="text-xs font-bold text-brand-slate bg-brand-slate/10 px-2 py-0.5 rounded border border-brand-slate/15">
                                            {rt.minOccupancy}–{rt.maxOccupancy}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center text-brand-slate text-xs font-medium">
                                        {rt.minAdults}–{rt.maxAdults}
                                    </td>
                                    <td className="px-5 py-3 text-center text-brand-slate text-xs font-medium">
                                        {rt.minChildren}–{rt.maxChildren}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        {rt.allowCotOverMax ? (
                                            <span className="text-[10px] bg-brand-mint/10 text-brand-mint border border-brand-mint/20 px-2 py-0.5 rounded-full font-bold uppercase">{t('auto.features.rooms.pages.roomtypespage.a78b3ab3', { defaultValue: "Autorisé" })}</span>
                                        ) : (
                                            <span className="text-[10px] bg-brand-light/80 text-brand-slate/70 border border-brand-slate/10 px-2 py-0.5 rounded-full font-bold uppercase">{t('auto.features.rooms.pages.roomtypespage.dfd69bda', { defaultValue: "Non" })}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                onClick={() => openEdit(rt)}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer border-none outline-none bg-transparent"
                                                title={t('auto.features.rooms.pages.roomtypespage.title.d44026b9', { defaultValue: "Modifier" })}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rt)}
                                                disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-navy hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none bg-transparent"
                                                title={t('auto.features.rooms.pages.roomtypespage.title.b7a64043', { defaultValue: "Supprimer" })}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-brand-light/80 border-t border-brand-slate/10 text-[10px] font-bold text-brand-slate/70 uppercase tracking-widest text-center">
                        Total {displayedRoomTypes.length} type{displayedRoomTypes.length > 1 ? 's' : ''} de chambre{displayedRoomTypes.length > 1 ? 's' : ''} affiché{displayedRoomTypes.length > 1 ? 's' : ''}
                    </div>
                </div>
            )}

            {/* ─── Archived Section (ADMIN only) ───────────────────────── */}
            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-slate hover:text-brand-navy transition-colors cursor-pointer border-none outline-none bg-transparent">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Chambres archivées {archivedRoomTypes ? `(${archivedRoomTypes.length})` : ''}
                    </button>

                    {showArchived && displayedArchivedTypes && displayedArchivedTypes.length > 0 && (
                        <div className="premium-surface mt-4 overflow-x-auto opacity-80">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-brand-slate/10 border-b border-brand-slate/15">
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.rooms.pages.roomtypespage.60a25d6c', { defaultValue: "Code" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.rooms.pages.roomtypespage.f530c0be', { defaultValue: "Libellé" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.rooms.pages.roomtypespage.ef856737', { defaultValue: "Action" })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-slate/10">
                                    {displayedArchivedTypes.map((rt) => (
                                        <tr key={rt.id} className="hover:bg-brand-slate/10 transition-colors cursor-default">
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-brand-slate/15 text-brand-slate text-xs font-bold font-mono tracking-wider border border-brand-slate/25">
                                                    {rt.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-brand-slate italic font-medium">{rt.name}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(rt)} disabled={restoreMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-mint/10 text-brand-mint text-xs font-medium rounded-xl hover:bg-brand-mint/15 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none">
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
                        <p className="mt-3 text-sm text-brand-slate/70 italic">{t('auto.features.rooms.pages.roomtypespage.112be6b0', { defaultValue: "Aucune chambre archivée" })}</p>
                    )}
                </div>
            )}

            {/* ─── Modal (Create / Edit) ──────────────────────────────── */}
            <EditRoomTypeModal
                isOpen={isModalOpen}
                onClose={closeModal}
                editing={editingRoom}
                onSubmit={onSubmit}
                isPending={isPending}
            />
        </div>
    );
}
