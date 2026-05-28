import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoomTypes, useArchivedRoomTypes, useCreateRoomType, useUpdateRoomType, useDeleteRoomType, useRestoreRoomType, type RoomType, type CreateRoomTypePayload } from '../hooks/useRoomTypes';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { BedDouble, Plus, Pencil, Trash2, RotateCcw, Archive, ChevronDown, ChevronRight, Search } from 'lucide-react';
import EditRoomTypeModal from '../components/EditRoomTypeModal';
import { GuidedPageHeader } from '../../../components/layout/Workspace';
import UpdatedByCell from '../../../components/audit/UpdatedByCell';
import PaginationControls, { DEFAULT_PAGE_SIZE, createClientPageMeta, getPageItems } from '../../../components/ui/PaginationControls';

export default function RoomTypesPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [archivedPage, setArchivedPage] = useState(1);
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const canManageArchive = user?.role === 'ADMIN' || user?.role === 'COMMERCIAL';

    const { data: roomTypes, isLoading, isError } = useRoomTypes();
    const { data: archivedRoomTypes } = useArchivedRoomTypes(canManageArchive && showArchived);

    useEffect(() => {
        setPage(1);
        setArchivedPage(1);
    }, [search]);

    const displayedRoomTypes = roomTypes?.filter(rt =>
        rt.name.toLowerCase().includes(search.toLowerCase()) ||
        rt.code.toLowerCase().includes(search.toLowerCase()) ||
        (rt.inventoryType ?? 'STANDARD').toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    const displayedArchivedTypes = archivedRoomTypes?.filter(rt =>
        rt.name.toLowerCase().includes(search.toLowerCase()) ||
        rt.code.toLowerCase().includes(search.toLowerCase()) ||
        (rt.inventoryType ?? 'STANDARD').toLowerCase().includes(search.toLowerCase())
    ) ?? [];
    const roomTypesMeta = createClientPageMeta(displayedRoomTypes.length, page, DEFAULT_PAGE_SIZE);
    const archivedTypesMeta = createClientPageMeta(displayedArchivedTypes.length, archivedPage, DEFAULT_PAGE_SIZE);
    const paginatedRoomTypes = getPageItems(displayedRoomTypes, roomTypesMeta);
    const paginatedArchivedTypes = getPageItems(displayedArchivedTypes, archivedTypesMeta);

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
            title: t('pages.roomTypes.confirmArchive.title', {
                defaultValue: 'Archive room type "{{code}} - {{name}}"?',
                code: room.code,
                name: room.name,
            }),
            description: t('pages.roomTypes.confirmArchive.description', {
                defaultValue: 'This room type will be archived and can be restored later.',
            }),
            confirmLabel: t('pages.roomTypes.confirmArchive.confirmLabel', { defaultValue: 'Archive' }),
            variant: "danger"
        })) {
            deleteMutation.mutate(room.id);
        }
    };

    const handleRestore = async (room: RoomType) => {
        if (await confirm({
            title: t('pages.roomTypes.confirmRestore.title', {
                defaultValue: 'Restore room type "{{code}} - {{name}}"?',
                code: room.code,
                name: room.name,
            }),
            description: t('pages.roomTypes.confirmRestore.description', {
                defaultValue: 'This room type will become active again.',
            }),
            confirmLabel: t('pages.roomTypes.confirmRestore.confirmLabel', { defaultValue: 'Restore' }),
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
                    {t('pages.roomTypes.errorLoad', { defaultValue: 'Unable to load room types.' })}
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
                title={t('pages.rooms.header.title', { defaultValue: 'Room Types' })}
                description={t('pages.rooms.header.subtitle', { defaultValue: "Define the hotel's sellable room inventory." })}
                actions={(
                <>
                <div className="hidden">
                    <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-brand-navy dark:text-brand-light">
                        <BedDouble className="text-brand-mint" size={28} />
                        {t('pages.rooms.header.title', { defaultValue: 'Room Types' })}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-slate dark:text-brand-light/75">
                        {t('pages.rooms.header.subtitle', { defaultValue: "Define the hotel's sellable room inventory." })}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-mint px-4 text-sm font-semibold text-brand-light shadow-md transition hover:-translate-y-0.5 hover:bg-brand-mint cursor-pointer border-none outline-none"
                >
                    <Plus size={16} />
                    {t('pages.roomTypes.modal.createTitle', { defaultValue: 'Add room type' })}
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
                        placeholder={t('auto.features.rooms.pages.roomtypespage.placeholder.4f8e2e50', { defaultValue: "Search room types..." })}
                        className="w-full rounded-xl border border-brand-slate/20 bg-brand-light/70 py-2.5 pl-9 pr-4 text-sm text-brand-navy outline-none transition focus:border-brand-mint/40 focus:ring-2 focus:ring-brand-mint/15 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                    />
                </div>
            </section>

            {/* Table */}
            {(!isLoading && !isError && roomTypes?.length === 0) ? (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <BedDouble size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.rooms.pages.roomtypespage.6d41bf0a', { defaultValue: "No room types defined yet" })}</p>
                    <p className="text-brand-slate/70 text-xs mt-1">{t('auto.features.rooms.pages.roomtypespage.eea025ef', { defaultValue: "Click “Add room type” to get started" })}</p>
                </div>
            ) : roomTypes && roomTypes.length > 0 && displayedRoomTypes.length === 0 ? (
                <div className="premium-surface border-dashed border-brand-slate/25 p-12 text-center">
                    <BedDouble size={40} className="mx-auto text-brand-slate/45 mb-3" />
                    <p className="text-brand-slate text-sm">
                        {t('pages.roomTypes.emptySearch', { defaultValue: 'No room type found for "{{search}}"', search })}
                    </p>
                </div>
            ) : displayedRoomTypes.length > 0 && (
                <div className="premium-surface overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-brand-light/80 border-b border-brand-slate/15">
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.rooms.pages.roomtypespage.60a25d6c', { defaultValue: "Code" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.rooms.pages.roomtypespage.f530c0be', { defaultValue: "Label" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('pages.roomTypes.table.inventoryType', { defaultValue: 'Type' })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.rooms.pages.roomtypespage.b23ebeb0', { defaultValue: "Occupancy" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.rooms.pages.roomtypespage.3033d562', { defaultValue: "Adults" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.rooms.pages.roomtypespage.8ebed994', { defaultValue: "Children" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-center">{t('auto.features.rooms.pages.roomtypespage.b3557035', { defaultValue: "Cot" })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('pages.roomTypes.table.updatedBy', { defaultValue: 'Updated by' })}</th>
                                <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">
                                    {t('pages.roomTypes.table.actions', { defaultValue: 'Actions' })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-slate/10">
                            {paginatedRoomTypes.map((rt) => (
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
                                        {(rt.inventoryType ?? 'STANDARD') === 'PROMO' ? (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase dark:bg-amber-400/10 dark:text-amber-200 dark:border-amber-400/20">
                                                {t('pages.roomTypes.inventory.promo', { defaultValue: 'Promo' })}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-brand-light/80 text-brand-slate/70 border border-brand-slate/10 px-2 py-0.5 rounded-full font-bold uppercase">
                                                {t('pages.roomTypes.inventory.standard', { defaultValue: 'Standard' })}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className="text-xs font-bold text-brand-slate bg-brand-slate/10 px-2 py-0.5 rounded border border-brand-slate/15">
                                            {rt.minOccupancy}-{rt.maxOccupancy}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center text-brand-slate text-xs font-medium">
                                        {rt.minAdults}-{rt.maxAdults}
                                    </td>
                                    <td className="px-5 py-3 text-center text-brand-slate text-xs font-medium">
                                        {rt.minChildren}-{rt.maxChildren}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        {rt.allowCotOverMax ? (
                                            <span className="text-[10px] bg-brand-mint/10 text-brand-mint border border-brand-mint/20 px-2 py-0.5 rounded-full font-bold uppercase">{t('auto.features.rooms.pages.roomtypespage.a78b3ab3', { defaultValue: "Allowed" })}</span>
                                        ) : (
                                            <span className="text-[10px] bg-brand-light/80 text-brand-slate/70 border border-brand-slate/10 px-2 py-0.5 rounded-full font-bold uppercase">{t('auto.features.rooms.pages.roomtypespage.dfd69bda', { defaultValue: "Non" })}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                        <UpdatedByCell updatedByName={rt.updatedByName} updatedAt={rt.updatedAt} />
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                onClick={() => openEdit(rt)}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-mint hover:bg-brand-mint/10 transition-colors cursor-pointer border-none outline-none bg-transparent"
                                                title={t('auto.features.rooms.pages.roomtypespage.title.d44026b9', { defaultValue: "Edit" })}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rt)}
                                                disabled={deleteMutation.isPending}
                                                className="p-1.5 rounded-xl text-brand-slate/70 hover:text-brand-navy hover:bg-brand-slate/10 transition-colors cursor-pointer disabled:opacity-50 border-none outline-none bg-transparent"
                                                title={t('auto.features.rooms.pages.roomtypespage.title.b7a64043', { defaultValue: "Archive" })}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                    <PaginationControls meta={roomTypesMeta} onPageChange={setPage} />
                </div>
            )}

            {/* ─── Archived Section ───────────────────────── */}
            {canManageArchive && (
                <div className="mt-10 space-y-4">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 rounded-lg border border-brand-light/70 bg-brand-light/70 px-4 py-2 text-sm font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        {t('pages.roomTypes.archived.toggle', {
                            defaultValue: 'Archived room types {{count}}',
                            count: archivedRoomTypes ? `(${archivedRoomTypes.length})` : '',
                        })}
                    </button>

                    {showArchived && displayedArchivedTypes.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-brand-light/70 dark:border-brand-light/10">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-brand-slate/10 border-b border-brand-slate/15">
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.rooms.pages.roomtypespage.60a25d6c', { defaultValue: "Code" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('auto.features.rooms.pages.roomtypespage.f530c0be', { defaultValue: "Label" })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide">{t('pages.roomTypes.table.updatedBy', { defaultValue: 'Updated by' })}</th>
                                        <th className="px-5 py-3 font-semibold text-brand-slate text-xs uppercase tracking-wide text-right">{t('auto.features.rooms.pages.roomtypespage.ef856737', { defaultValue: "Action" })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-slate/10">
                                    {paginatedArchivedTypes.map((rt) => (
                                        <tr key={rt.id} className="hover:bg-brand-slate/10 transition-colors cursor-default">
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl bg-brand-slate/15 text-brand-slate text-xs font-bold font-mono tracking-wider border border-brand-slate/25">
                                                    {rt.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-brand-slate italic font-medium">{rt.name}</td>
                                            <td className="px-5 py-3 align-top">
                                                <UpdatedByCell updatedByName={rt.updatedByName} updatedAt={rt.updatedAt} />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(rt)} disabled={restoreMutation.isPending}
                                                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-mint/10 px-4 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-60">
                                                    <RotateCcw size={14} />
                                                    {t('pages.roomTypes.archived.restore', { defaultValue: 'Restore' })}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                            <PaginationControls meta={archivedTypesMeta} onPageChange={setArchivedPage} />
                        </div>
                    )}

                    {showArchived && archivedRoomTypes && archivedRoomTypes.length === 0 && (
                        <div className="rounded-lg border border-dashed border-brand-slate/20 px-6 py-10 text-center text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">{t('auto.features.rooms.pages.roomtypespage.112be6b0', { defaultValue: "No archived room types" })}</div>
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
