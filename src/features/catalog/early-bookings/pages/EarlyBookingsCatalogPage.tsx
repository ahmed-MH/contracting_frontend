import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Archive, Search, Calendar, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../auth/context/AuthContext';
import { useConfirm } from '../../../../context/ConfirmContext';
import type { CreateTemplateEarlyBookingPayload, TemplateEarlyBooking } from '../types/early-bookings.types';
import {
    useTemplateEarlyBookings,
    useArchivedTemplateEarlyBookings,
    useCreateTemplateEarlyBooking,
    useUpdateTemplateEarlyBooking,
    useDeleteTemplateEarlyBooking,
    useRestoreTemplateEarlyBooking,
} from '../hooks/useTemplateEarlyBookings';
import EarlyBookingsTable from '../components/EarlyBookingsTable';
import EditEarlyBookingTemplateModal from '../components/EditEarlyBookingTemplateModal';

export default function EarlyBookingsCatalogPage() {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateEarlyBooking | null>(null);
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

    const { data: paginatedResult, isLoading, isError } = useTemplateEarlyBookings(page, limit, debouncedSearch);
    const earlyBookings = paginatedResult?.data ?? [];
    const meta = paginatedResult?.meta;
    const { data: archivedEarlyBookings } = useArchivedTemplateEarlyBookings({ enabled: isAdmin });

    const createMutation = useCreateTemplateEarlyBooking();
    const updateMutation = useUpdateTemplateEarlyBooking();
    const deleteMutation = useDeleteTemplateEarlyBooking();
    const restoreMutation = useRestoreTemplateEarlyBooking();

    const openCreate = () => {
        setEditing(null);
        setIsModalOpen(true);
    };

    const openEdit = (eb: TemplateEarlyBooking) => {
        setEditing(eb);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditing(null);
    };

    const handleDelete = async (eb: TemplateEarlyBooking) => {
        if (await confirm({
            title: `Archiver l'Early Booking "${eb.name}" ?`,
            description: "L'Early Booking sera archivé et ne sera plus visible dans le catalogue.",
            confirmLabel: "Archiver",
            variant: "danger",
        })) {
            deleteMutation.mutate(eb.id);
        }
    };

    const handleRestore = async (eb: TemplateEarlyBooking) => {
        if (await confirm({
            title: `Restaurer l'Early Booking "${eb.name}" ?`,
            description: "L'Early Booking sera de nouveau disponible dans le catalogue.",
            confirmLabel: "Restaurer",
            variant: "info",
        })) {
            restoreMutation.mutate(eb.id);
        }
    };

    const handleSubmit = (payload: CreateTemplateEarlyBookingPayload) => {
        if (editing) {
            updateMutation.mutate(
                { id: editing.id, data: payload },
                { onSuccess: closeModal }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: closeModal });
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-3">
                        <Calendar className="text-brand-mint" size={28} />
                        {t('pages.catalog.earlyBookings.header.title', { defaultValue: 'Catalogue Early Booking' })}
                    </h1>
                    <p className="text-sm text-brand-slate mt-1">{t('auto.features.catalog.early.bookings.pages.earlybookingscatalogpage.6c3403db', { defaultValue: "Définitions des offres de réservations anticipées (templates)" })}</p>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-mint text-white text-sm font-medium rounded-xl hover:bg-brand-mint transition-colors shadow-sm cursor-pointer border-none outline-none">
                    <Plus size={16} /> Nouvel Early Booking
                </button>
            </div>

            <div className="mb-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('pages.catalog.earlyBookings.header.searchPlaceholder', { defaultValue: 'Rechercher un template...' })}
                        className="w-full pl-9 pr-4 py-2 border border-brand-slate/20 rounded-xl text-sm focus:ring-2 focus:ring-brand-mint outline-none"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-mint/30 border-t-transparent" />
                </div>
            )}

            {isError && (
                <div className="rounded-xl bg-brand-slate/10 border border-brand-slate/30 p-6 text-brand-slate text-sm font-bold">
                    {t('pages.catalog.earlyBookings.states.loadError', { defaultValue: 'Impossible de charger le catalogue Early Booking.' })}
                </div>
            )}

            {!isLoading && !isError && earlyBookings.length === 0 && (
                <div className="rounded-xl bg-brand-light border border-dashed border-brand-slate/20 p-12 text-center">
                    <Calendar size={40} className="mx-auto text-brand-slate mb-3" />
                    <p className="text-brand-slate text-sm">{t('auto.features.catalog.early.bookings.pages.earlybookingscatalogpage.d0a626c9', { defaultValue: "Aucun template trouvé" })}</p>
                </div>
            )}

            {earlyBookings.length > 0 && (
                <EarlyBookingsTable
                    data={earlyBookings}
                    meta={meta}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onPageChange={setPage}
                />
            )}

            {isAdmin && (
                <div className="mt-10">
                    <button onClick={() => setShowArchived(!showArchived)}
                        className="inline-flex items-center gap-2 text-sm text-brand-slate hover:text-brand-navy transition-colors cursor-pointer border-none bg-transparent outline-none font-bold">
                        {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Archive size={16} />
                        Templates archivés {archivedEarlyBookings ? `(${archivedEarlyBookings.length})` : ''}
                    </button>

                    {showArchived && archivedEarlyBookings && archivedEarlyBookings.length > 0 && (
                        <div className="mt-4 bg-brand-light rounded-xl border border-brand-slate/20 overflow-hidden opacity-80 shadow-xs">
                            <table className="w-full text-sm text-left">
                                <tbody className="divide-y divide-brand-slate/10">
                                    {archivedEarlyBookings.map((eb: any) => (
                                        <tr key={eb.id} className="hover:bg-brand-light transition-colors">
                                            <td className="px-5 py-3 text-brand-slate font-bold">{eb.name}</td>
                                            <td className="px-5 py-3 text-center text-[10px] text-brand-slate font-mono italic">
                                                {eb.bookingWindowStart ? `${eb.bookingWindowStart} -> ${eb.bookingWindowEnd}` : 'Fenêtre libre'}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button onClick={() => handleRestore(eb)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-mint/10 text-brand-mint text-xs font-bold rounded-xl hover:bg-brand-mint/10 transition-colors cursor-pointer border-none shadow-xs">
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

            <EditEarlyBookingTemplateModal
                isOpen={isModalOpen}
                editItem={editing}
                onClose={closeModal}
                onSubmit={handleSubmit}
                isPending={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
